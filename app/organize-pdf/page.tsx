"use client";

import { useState, useEffect } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { Layers } from "lucide-react"; // Icon for Organize
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { usePWAFile } from "../hooks/usePWAFile";

// Components from class-notes-print (Reused)
import StepsIndicator from "../class-notes-print/components/StepsIndicator";
import ProcessingView from "../class-notes-print/components/ProcessingView";
import SuccessView from "../class-notes-print/components/SuccessView";
import PageSelector from "../class-notes-print/components/PageSelector";
import PageEditModal, { CropRegion } from "../class-notes-print/components/PageEditModal";
import { renderPageToCanvas } from "../utils/class-notes-utils";

interface AddedFile {
    file: File;
    pdfRef: any;
    pageCount: number;
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

export default function OrganizePdfPage({ initialFile }: { initialFile?: File }) {
    const [step, setStep] = useState(0);
    const [addedFiles, setAddedFiles] = useState<AddedFile[]>([]);

    useEffect(() => {
        if (initialFile) {
            handleFilesSelected([initialFile]);
        }
    }, [initialFile]);

    // Page Management State
    const [totalPages, setTotalPages] = useState(0);
    const [pageToFileMap, setPageToFileMap] = useState<Record<number, number>>({});
    const [selectedPages, setSelectedPages] = useState<number[]>([]); // Global page numbers
    const [pageOrder, setPageOrder] = useState<number[]>([]); // Global page numbers in order
    const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
    const [pageCrops, setPageCrops] = useState<Record<number, CropRegion>>({});
    const [pageEdits, setPageEdits] = useState<Record<number, string>>({});

    // Editing State
    const [editingPage, setEditingPage] = useState<number | null>(null);

    // Processing State
    const [progressState, setProgressState] = useState({
        percent: 0,
        current: 0,
        total: 0,
        estimatedTime: "Calculating..."
    });

    const [successData, setSuccessData] = useState<{
        blob: Blob | null;
        formattedSize: string;
        pageCount: number;
    } | null>(null);

    usePWAFile((file) => {
        handleFilesSelected([file]);
    });

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        try {
            const pdfjs = await import("pdfjs-dist");
            // Use local worker to ensure better compatibility and no CORS/CDN issues
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            }

            const newFiles: AddedFile[] = [];
            let currentTotalPages = totalPages;
            const newMap = { ...pageToFileMap };

            for (const file of files) {
                const buffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({
                    data: buffer,
                    useWorkerFetch: false,
                    isEvalSupported: false,
                    useSystemFonts: true,
                }).promise;

                newFiles.push({
                    file,
                    pdfRef: pdf,
                    pageCount: pdf.numPages
                });

                // Map pages
                for (let i = 1; i <= pdf.numPages; i++) {
                    newMap[currentTotalPages + i] = addedFiles.length + newFiles.length - 1;
                }
                currentTotalPages += pdf.numPages;
            }

            setAddedFiles(prev => [...prev, ...newFiles]);
            setTotalPages(currentTotalPages);
            setPageToFileMap(newMap);

            // Auto-select new pages by default? Or keep existing selection?
            // Usually organize means "here are all pages, reorder them".
            // So we initially select ALL.
            // If just adding files, append to selection.
            const newPageNums = Array.from({ length: currentTotalPages - totalPages }, (_, i) => totalPages + i + 1);
            setSelectedPages(prev => [...prev, ...newPageNums]);

            setStep(1);
        } catch (error) {
            console.error("Error loading PDF", error);
            toast.error("Failed to load PDF file");
        }
    };

    const handleEditPage = (globalPageNum: number) => {
        setEditingPage(globalPageNum);
    };

    const handleSaveEdit = (globalPageNum: number, rotations: number, crop: CropRegion | null, editedImage?: string) => {
        setPageRotations(prev => ({ ...prev, [globalPageNum]: rotations }));
        if (crop) setPageCrops(prev => ({ ...prev, [globalPageNum]: crop }));
        // If editedImage is provided (from canvas), save it
        if (editedImage) {
            setPageEdits(prev => ({ ...prev, [globalPageNum]: editedImage }));
        }
        setEditingPage(null);
    };

    const handleProcess = async () => {
        if (selectedPages.length === 0) {
            toast.error("Select at least one page");
            return;
        }

        setStep(2); // Processing
        const startTime = Date.now();

        // Filter pageOrder to only include selected pages
        const finalOrder = pageOrder.filter(p => selectedPages.includes(p));

        setProgressState({ percent: 0, current: 0, total: finalOrder.length, estimatedTime: "Starting..." });

        try {
            const newPdf = await PDFDocument.create();

            for (let i = 0; i < finalOrder.length; i++) {
                const globalPageNum = finalOrder[i];
                const fileIndex = pageToFileMap[globalPageNum];
                const fileData = addedFiles[fileIndex];

                // Calculate local index
                let localPageIndex = globalPageNum - 1;
                // Adjust for previous files
                // We need to know start index of this file in global map.
                // Naive approach: find first key in map with this value? 
                // Or sum page counts of previous files.
                for (let j = 0; j < fileIndex; j++) {
                    localPageIndex -= addedFiles[j].pageCount;
                }

                // If page is EDITED manually (drawing/rasterized in modal), use the image
                if (pageEdits[globalPageNum]) {
                    const pngImageBytes = pageEdits[globalPageNum];
                    const embeddedImage = await newPdf.embedPng(pngImageBytes);
                    const page = newPdf.addPage([embeddedImage.width, embeddedImage.height]);
                    page.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: embeddedImage.width,
                        height: embeddedImage.height,
                    });
                } else {
                    // Vector Copy
                    const srcPdf = await PDFDocument.load(await fileData.file.arrayBuffer());
                    const [copiedPage] = await newPdf.copyPages(srcPdf, [localPageIndex]);

                    // Apply Rotation
                    const rot = pageRotations[globalPageNum] || 0;
                    if (rot !== 0) {
                        const existingRot = copiedPage.getRotation().angle;
                        copiedPage.setRotation(degrees(existingRot + rot));
                    }

                    // Apply Crop?
                    // Note: copyPages might include existing crop?
                    // If we have manual crop from UI (percentage based usually in class-notes-utils or pixel based?),
                    // PageEditModal returns crop logic. 
                    // MVP: Organize PDF usually focuses on order/rotation. 
                    // If user used "Crop" tool in modal, it usually rasterizes to an image in PageEditModal.
                    // So if crop exists, it likely came via pageEdits (editedImage).
                    // If pageCrops exists but NO pageEdits, it implies generic crop?
                    // We'll assume edits cover crops for now.

                    newPdf.addPage(copiedPage);
                }

                // Update Progress
                const percent = Math.round(((i + 1) / finalOrder.length) * 100);
                setProgressState(prev => ({ ...prev, percent, current: i + 1 }));
            }

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            setSuccessData({
                blob,
                formattedSize: formatBytes(blob.size),
                pageCount: finalOrder.length
            });
            setStep(3);

        } catch (error) {
            console.error(error);
            toast.error("Failed to organize PDF");
            setStep(1);
        }
    };

    return (
        <ToolLayout
            title="Organize PDF"
            description="Sort, add, and delete PDF pages. Drag and drop to reorder."
            icon={<Layers className="w-10 h-10 text-cyan-400" />}
        >
            <div className="mb-8">
                <StepsIndicator
                    currentStep={step}
                    steps={["Upload", "Organize", "Processing", "Download"]}
                />
            </div>

            {/* Step 0: Upload */}
            {step === 0 && (
                <div className="max-w-4xl mx-auto h-[60vh]">
                    <FileDropZone
                        onFilesSelected={handleFilesSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={10} // Allow multiple
                        title="Drop PDFs to organize"
                        className="h-full"
                    />
                </div>
            )}

            {/* Step 1: Organize */}
            {step === 1 && (
                <div className="fade-in">
                    <PageSelector
                        files={addedFiles}
                        totalPages={totalPages}
                        pageToFileMap={pageToFileMap}
                        selectedPages={selectedPages}
                        onSelectionChange={setSelectedPages}
                        onPageOrderChange={setPageOrder}
                        onNext={handleProcess}
                        onBack={() => setStep(0)}
                        onEdit={handleEditPage}
                        pageRotations={pageRotations}
                        pageCrops={pageCrops}
                        pageEdits={pageEdits}
                        onAddMore={handleFilesSelected}
                    />
                </div>
            )}

            {/* Step 2: Processing */}
            {step === 2 && (
                <ProcessingView
                    progress={progressState.percent}
                    currentStep="Building PDF..."
                    subText={`Processed ${progressState.current} pages`}
                    processedPages={progressState.current}
                    totalPages={progressState.total}
                    estimatedTimeRemaining={progressState.estimatedTime}
                />
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <SuccessView
                    fileName="organized.pdf"
                    originalSize={formatBytes(addedFiles.reduce((acc, f) => acc + f.file.size, 0))}
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
                            saveAs(successData.blob, name || "organized.pdf");
                        }
                    }}
                    onProcessAnother={() => {
                        setStep(0);
                        setAddedFiles([]);
                        setTotalPages(0);
                        setPageToFileMap({});
                        setSuccessData(null);
                        setProgressState({ percent: 0, current: 0, total: 0, estimatedTime: '' });
                    }}
                    onEditAgain={() => setStep(1)}
                />
            )}

            {/* Edit Modal */}
            {editingPage !== null && (
                <PageEditModal
                    isOpen={true}
                    onClose={() => setEditingPage(null)}
                    pdf={addedFiles[pageToFileMap[editingPage]].pdfRef}
                    pageNumber={(() => {
                        const fileIndex = pageToFileMap[editingPage];
                        // Calculate how many pages were in previous files
                        const previousPagesCount = addedFiles
                            .slice(0, fileIndex)
                            .reduce((acc, f) => acc + f.pageCount, 0);

                        // Convert global page (1-based) to local page (1-based)
                        return editingPage - previousPagesCount;
                    })()}
                    initialRotation={pageRotations[editingPage] || 0}
                    initialCrop={pageCrops[editingPage]}
                    onApply={(rotations, crop, editedImage) => {
                        handleSaveEdit(editingPage, rotations, crop || null, editedImage);
                    }}
                />
            )}
        </ToolLayout>
    );
}
// just a text to pust on github as refresh