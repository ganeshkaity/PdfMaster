"use client";

import { useState, useEffect } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { Scissors, Loader2, Download, Layers, Timer, CheckCircle2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { renderPageToCanvas } from "../utils/class-notes-utils";



// Import Shared Components
import SplitPageSelector from "./components/SplitPageSelector";
import StepsIndicator from "../class-notes-print/components/StepsIndicator";
import SplitProcessingView from "./components/SplitProcessingView";
import SplitSuccessView from "./components/SplitSuccessView";

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function SplitPdfPage() {
    const [step, setStep] = useState(0);

    const [files, setFiles] = useState<Array<{ file: File; pdfRef: any; pageCount: number }>>([]);
    const [numPages, setNumPages] = useState(0);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [pageOrder, setPageOrder] = useState<number[]>([]);
    const [pageToFileMap, setPageToFileMap] = useState<Record<number, number>>({});

    // Split Configuration
    const [splitMode, setSplitMode] = useState<"all" | "select">("all");
    const [outputFormat, setOutputFormat] = useState<"pdf" | "jpg" | "png">("pdf");

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



    // File Selection Handler
    const handleFileSelected = async (newFiles: File[]) => {
        if (newFiles.length === 0) return;
        const pdfjsLib = await import("pdfjs-dist");

        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }

        const toastId = toast.loading("Loading PDF(s)...");
        try {
            const addedFiles: Array<{ file: File; pdfRef: any; pageCount: number }> = [];
            let globalPageCounter = numPages; // Start from current total
            const newPageToFileMap = { ...pageToFileMap };
            const newPageOrder = [...pageOrder];

            for (let i = 0; i < newFiles.length; i++) {
                const file = newFiles[i];
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                const filePageCount = pdf.numPages;

                addedFiles.push({
                    file,
                    pdfRef: pdf, // Store pdfjs proxy
                    pageCount: filePageCount
                });

                // Map pages
                for (let p = 0; p < filePageCount; p++) {
                    const globalPageNum = globalPageCounter + p + 1; // 1-based
                    newPageToFileMap[globalPageNum] = files.length + i; // Index in files array
                    newPageOrder.push(globalPageNum);
                }
                globalPageCounter += filePageCount;
            }

            setFiles(prev => [...prev, ...addedFiles]);
            setNumPages(globalPageCounter);
            setPageToFileMap(newPageToFileMap);
            setPageOrder(newPageOrder);

            // Auto-select all pages initially
            const allPages = Array.from({ length: globalPageCounter }, (_, i) => i + 1);
            setSelectedPages(allPages);

            setStep(1); // Move to selection step
            toast.success(`Loaded ${newFiles.length} file(s)`, { id: toastId });

        } catch (error) {
            console.error(error);
            toast.error("Failed to load PDF", { id: toastId });
        }
    };

    const handleProcess = async () => {
        setStep(2); // Processing
        const startTime = Date.now();
        setProgressState({ percent: 0, current: 0, total: 0, estimatedTime: "Starting..." });

        try {
            // Determine pages to process
            let finalPages: number[] = [];
            if (splitMode === "all") {
                finalPages = pageOrder; // All pages in current order
            } else {
                finalPages = pageOrder.filter(p => selectedPages.includes(p));
            }

            if (finalPages.length === 0) {
                throw new Error("No pages selected");
            }

            setProgressState(prev => ({ ...prev, total: finalPages.length }));

            // Initialize ZIP
            const zip = new JSZip();

            for (let i = 0; i < finalPages.length; i++) {
                const globalPageNum = finalPages[i];
                const fileIndex = pageToFileMap[globalPageNum];
                const sourceFileObj = files[fileIndex];
                if (!sourceFileObj) continue;

                // local page index (0-based for pdf-lib)
                let offset = 0;
                for (let f = 0; f < fileIndex; f++) offset += files[f].pageCount;
                const localPageIdx0 = globalPageNum - offset - 1;
                const localPageIdx1 = localPageIdx0 + 1; // 1-based for renderPageToCanvas

                if (outputFormat === 'pdf') {
                    // Export as PDF
                    const srcArrayBuffer = await sourceFileObj.file.arrayBuffer();
                    const srcPdf = await PDFDocument.load(srcArrayBuffer);

                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(srcPdf, [localPageIdx0]);
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();

                    zip.file(`Page_${globalPageNum}.pdf`, pdfBytes);
                } else {
                    // Export as Image (JPG/PNG)
                    const canvas = await renderPageToCanvas(sourceFileObj.pdfRef, localPageIdx1, 2, 0); // Scale 2 for better quality

                    if (!canvas) {
                        console.error(`Failed to render page ${globalPageNum}`);
                        continue;
                    }

                    const blob = await new Promise<Blob | null>(resolve =>
                        canvas.toBlob(resolve, outputFormat === 'png' ? 'image/png' : 'image/jpeg', 0.9)
                    );

                    if (blob) {
                        zip.file(`Page_${globalPageNum}.${outputFormat}`, blob);
                    }
                }

                // Update Progress
                const percent = Math.round(((i + 1) / finalPages.length) * 100);
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = (i + 1) / elapsed;
                const remaining = (finalPages.length - (i + 1)) / rate;

                setProgressState(prev => ({
                    ...prev,
                    percent,
                    current: i + 1,
                    estimatedTime: remaining < 1 ? "Finishing..." : `~${Math.ceil(remaining)}s remaining`
                }));
            }

            const blob = await zip.generateAsync({ type: "blob" });
            setSuccessData({
                blob: blob,
                formattedSize: formatBytes(blob.size),
                pageCount: finalPages.length
            });

            setStep(3); // Success

        } catch (error) {
            console.error(error);
            toast.error("Extraction failed");
            setStep(1); // Go back
        }
    };

    return (
        <ToolLayout
            title="Split PDF"
            description="Extract pages from your PDF file. Split into individual pages or extract specific pages."
            icon={<Scissors className="w-10 h-10 text-cyan-400" />}
        >
            {/* Step Indicator */}
            <div className="mb-8">
                <StepsIndicator
                    currentStep={step}
                    steps={["Upload", "Select Pages", "Processing", "Download"]}
                />
            </div>

            {/* Step 0: Upload */}
            {step === 0 && (
                <div className="max-w-4xl mx-auto h-[60vh] flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <FileDropZone
                            onFilesSelected={handleFileSelected}
                            accept={{ "application/pdf": [".pdf"] }}
                            maxFiles={10}
                            title="Drop PDFs to split"
                            className="h-full min-h-[400px]"
                        />
                    </div>
                </div>
            )}

            {/* Step 1: Configuration */}
            {step === 1 && (
                <div className="space-y-6">

                    {/* Mode Selection Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => { setSplitMode("all"); }}
                            className={`p-6 rounded-xl border-2 transition-all text-left space-y-2 ${splitMode === "all"
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                                }`}
                        >
                            <Layers className={`w-6 h-6 ${splitMode === "all" ? "text-cyan-400" : "text-slate-400"}`} />
                            <h4 className="font-bold text-white">Extract All Pages</h4>
                            <p className="text-sm text-slate-400">Save every page as a separate PDF file (ZIP download).</p>
                        </button>

                        <button
                            onClick={() => { setSplitMode("select"); }}
                            className={`p-6 rounded-xl border-2 transition-all text-left space-y-2 ${splitMode === "select"
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                                }`}
                        >
                            <CheckCircle2 className={`w-6 h-6 ${splitMode === "select" ? "text-cyan-400" : "text-slate-400"}`} />
                            <h4 className="font-bold text-white">Select Pages</h4>
                            <p className="text-sm text-slate-400">Extract specific pages as a separate PDF/png/jpg file (ZIP download).</p>
                        </button>
                    </div>

                    {/* Page Selector */}
                    {splitMode === "select" && (
                        <div className="bg-slate-900/50 rounded-xl border border-white/5 p-6 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-lg font-bold text-white">Select Pages to Extract</h3>

                            {/* Format Selection */}
                            <div className="flex items-center gap-4 my-4 bg-black/20 p-3 rounded-xl border border-white/5">
                                <span className="text-sm font-medium text-slate-400">Output Format:</span>
                                <div className="flex gap-2">
                                    {(['pdf', 'jpg', 'png'] as const).map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setOutputFormat(fmt)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${outputFormat === fmt
                                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 scale-105'
                                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                                                }`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <SplitPageSelector
                                files={files}
                                totalPages={numPages}
                                pageToFileMap={pageToFileMap}
                                selectedPages={selectedPages}
                                onSelectionChange={setSelectedPages}
                            />
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                        <button
                            onClick={() => { setStep(0); setFiles([]); setNumPages(0); }}
                            className="px-6 py-4 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition"
                        >
                            Start Over
                        </button>
                        <button
                            onClick={handleProcess}
                            disabled={splitMode === 'select' && selectedPages.length === 0}
                            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-lg shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Scissors className="w-5 h-5" /> Start Extracting
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Processing */}
            {step === 2 && (
                <SplitProcessingView
                    progress={progressState.percent}
                    subText={`Processed ${progressState.current} of ${progressState.total} pages`}
                    processedPages={progressState.current}
                    totalPages={progressState.total}
                    estimatedTimeRemaining={progressState.estimatedTime}
                />
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <SplitSuccessView
                    fileName={"extracted_pages.zip"}
                    originalSize="-"
                    finalSize={successData?.formattedSize || "0 MB"}
                    pageCount={successData?.pageCount || 0}
                    onDownload={(name) => {
                        if (successData?.blob) {
                            saveAs(successData.blob, name || "extracted_pages.zip");
                        }
                    }}
                    onProcessAnother={() => {
                        setStep(0);
                        setFiles([]);
                        setNumPages(0);
                    }}
                />
            )}
        </ToolLayout>
    );
}
