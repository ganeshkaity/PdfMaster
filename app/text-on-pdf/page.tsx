"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { FileCog } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

// Components
import StepsIndicator from "../class-notes-print/components/StepsIndicator";
import ProcessingView from "../class-notes-print/components/ProcessingView";
import SuccessView from "../class-notes-print/components/SuccessView";
import PdfEditor from "./components/PdfEditor";
import { usePWAFile } from "../hooks/usePWAFile";

interface TextOverlay {
    id: string;
    text: string;
    xPercent: number; // 0-100
    yPercent: number; // 0-100
    size: number;
    color: string;
    pageNum: number; // 1-based
}

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function EditPdfPage() {
    const [step, setStep] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [originalSize, setOriginalSize] = useState("0 MB");

    // Processing State
    const [progressState, setProgressState] = useState({
        percent: 0,
        current: 0,
        total: 0,
        estimatedTime: "Calculating..."
    });

    // Success State
    const [successData, setSuccessData] = useState<{
        blob: Blob | null;
        formattedSize: string;
        pageCount: number;
    } | null>(null);


    usePWAFile((file) => {
        handleFileSelected([file]);
    });


    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setOriginalSize(formatBytes(files[0].size));
            setStep(1); // Go to Editor
        }
    };

    const handleProcess = async (edits: TextOverlay[]) => {
        if (!file) return;

        setStep(2); // Processing
        const startTime = Date.now();
        setProgressState({ percent: 0, current: 0, total: edits.length, estimatedTime: "Starting..." });

        try {
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buffer);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            // Process Edits
            for (let i = 0; i < edits.length; i++) {
                const item = edits[i];
                const pageIndex = item.pageNum - 1;
                if (pageIndex >= 0 && pageIndex < pages.length) {
                    const page = pages[pageIndex];
                    const { width, height } = page.getSize();

                    // Convert Percent to PDF Points
                    // PDF Origin is Bottom-Left
                    // Canvas/Screen Origin is Top-Left
                    const pdfX = width * (item.xPercent / 100);
                    const pdfY = height - (height * (item.yPercent / 100));

                    // Parse color (hex to rgb)
                    const r = parseInt(item.color.slice(1, 3), 16) / 255;
                    const g = parseInt(item.color.slice(3, 5), 16) / 255;
                    const b = parseInt(item.color.slice(5, 7), 16) / 255;

                    page.drawText(item.text, {
                        x: pdfX,
                        y: pdfY,
                        size: item.size,
                        font: helveticaFont,
                        color: rgb(r, g, b),
                        // Adjust coordinate for font height? 
                        // drawText origin is bottom-left of the text box?
                        // Visually we centered the div on the coordinate.
                        // We might need to adjust offsets slightly for perfect centering but this is MVP.
                    });
                }

                // Update Progress
                const percent = Math.round(((i + 1) / edits.length) * 100);
                setProgressState(prev => ({
                    ...prev,
                    percent,
                    current: i + 1
                }));
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            setSuccessData({
                blob,
                formattedSize: formatBytes(blob.size),
                pageCount: pages.length
            });

            setStep(3); // Success

        } catch (error) {
            console.error(error);
            toast.error("Failed to save PDF");
            setStep(1); // Return to editor
        }
    };

    return (
        <ToolLayout
            title="Write Text on PDF"
            description="Add text, images, and annotations to your PDF pages."
            icon={<FileCog className="w-10 h-10 text-cyan-400" />}
        >
            {/* Steps Indicator */}
            <div className="mb-8">
                <StepsIndicator
                    currentStep={step}
                    steps={["Upload", "Write Text", "Processing", "Download"]}
                />
            </div>

            {/* Step 0: Upload */}
            {step === 0 && (
                <div className="max-w-4xl mx-auto h-[60vh] flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <FileDropZone
                            onFilesSelected={handleFileSelected}
                            accept={{ "application/pdf": [".pdf"] }}
                            maxFiles={1}
                            title="Drop PDF to edit"
                            className="h-full min-h-[400px]"
                        />
                    </div>
                </div>
            )}

            {/* Step 1: Editor */}
            {step === 1 && file && (
                <div className="fade-in">
                    <PdfEditor
                        file={file}
                        onProcess={handleProcess}
                        onBack={() => { setStep(0); setFile(null); }}
                    />
                </div>
            )}

            {/* Step 2: Processing */}
            {step === 2 && (
                <ProcessingView
                    progress={progressState.percent}
                    currentStep="Applying Edits..."
                    subText={`Processed ${progressState.current} of ${progressState.total} edits`}
                    processedPages={progressState.current}
                    totalPages={progressState.total}
                    estimatedTimeRemaining={progressState.estimatedTime}
                />
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <SuccessView
                    fileName={file?.name ? `edited_${file.name}` : "edited.pdf"}
                    originalSize={originalSize}
                    finalSize={successData?.formattedSize || "0 MB"}
                    pageCount={successData?.pageCount || 0}
                    onPreview={() => {
                        if (successData?.blob) {
                            const url = URL.createObjectURL(successData.blob);
                            window.open(url, '_blank');
                        }
                    }}
                    onDownload={(name) => {
                        if (successData?.blob) {
                            saveAs(successData.blob, name || `edited_${file?.name || 'document'}.pdf`);
                        }
                    }}
                    onProcessAnother={() => {
                        setStep(0);
                        setFile(null);
                        setSuccessData(null);
                    }}
                    onEditAgain={() => setStep(1)}
                />
            )}
        </ToolLayout>
    );
}
