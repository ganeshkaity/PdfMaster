"use client";

import { useState, useRef, useEffect } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import {
    FileText, Wand2, Layout, Trash2, Download, Settings2, CheckCircle2,
    ChevronRight, Circle, ArrowLeft, MoreVertical, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { initPdfJs, renderPageToCanvas, applyFiltersToCanvas, FilterOptions, LogoRegion } from "../utils/class-notes-utils";
import { jsPDF } from "jspdf";
import PageSelector from "./components/PageSelector";
import InteractiveLogoRemover from "./components/InteractiveLogoRemover";

export default function ClassNotesPrintPage() {
    // Pipeline Steps: 0 = Upload, 1 = Select Pages, 2 = Configure/Preview
    const [step, setStep] = useState(0);

    const [file, setFile] = useState<File | null>(null);
    const [pdfRef, setPdfRef] = useState<any>(null);
    const [numPages, setNumPages] = useState(0);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Enhancement / Filters
    const [filters, setFilters] = useState<FilterOptions>({
        invert: false,
        grayscale: false,
        removeBackground: false, // "Clear PDF Background"
        brightness: 100,
        contrast: 100,
    });
    // Extra filter for "Black & White" (Pure thresholding, distinct from Grayscale)
    const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);


    // Layout Controls
    const [layout, setLayout] = useState({
        slidesPerRow: 1,
        slidesPerCol: 3, // Default to 3 rows as per screenshot
        orientation: "portrait" as "portrait" | "landscape",
        pageSize: "a4",
        showSeparationLines: false, // "No" by default
    });

    // Logo Removal
    const [showLogoModal, setShowLogoModal] = useState(false);
    const [logoRegion, setLogoRegion] = useState<LogoRegion | undefined>(undefined);
    const [isLogoRemovalEnabled, setIsLogoRemovalEnabled] = useState(false);

    // Preview
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [previewPage, setPreviewPage] = useState<number>(1); // Which page to preview in the main editor

    useEffect(() => {
        initPdfJs();
    }, []);

    // --- Handlers ---

    const handleFileSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const selectedFile = files[0];
        setFile(selectedFile);

        try {
            const pdfjs = await import("pdfjs-dist");
            const buffer = await selectedFile.arrayBuffer();
            const pdf = await pdfjs.getDocument(buffer).promise;
            setPdfRef(pdf);
            setNumPages(pdf.numPages);
            setSelectedPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
            setStep(1); // Move to Page Selection
        } catch (error) {
            console.error(error);
            toast.error("Failed to load PDF.");
        }
    };

    const handlePageSelectionNext = () => {
        if (selectedPages.length === 0) {
            toast.error("Please select at least one page.");
            return;
        }
        setPreviewPage(selectedPages[0]); // Default preview to first selected
        setStep(2); // Move to Configure
    };

    // --- Preview Logic ---
    const renderLivePreview = async () => {
        if (!pdfRef || !previewCanvasRef.current) return;

        // Render base page
        const canvas = await renderPageToCanvas(pdfRef, previewPage, 0.8);
        if (!canvas || !previewCanvasRef.current) return;

        const ctx = previewCanvasRef.current.getContext('2d');
        if (!ctx) return;

        previewCanvasRef.current.width = canvas.width;
        previewCanvasRef.current.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);

        // Apply filters
        // If Black & White is Checked, we might override grayscale or handle it in applyFilters
        // For now let's pass it as a special case or part of filters
        const activeFilters = { ...filters };
        if (isBlackAndWhite) {
            // Simple hack: High contrast + grayscale = B&W-ish
            activeFilters.grayscale = true;
            activeFilters.contrast = 150;
        }

        applyFiltersToCanvas(previewCanvasRef.current, activeFilters, isLogoRemovalEnabled ? logoRegion : undefined);
    };

    useEffect(() => {
        if (step === 2) {
            renderLivePreview();
        }
    }, [step, filters, isBlackAndWhite, logoRegion, isLogoRemovalEnabled, previewPage]);


    // --- Output Generation ---
    const handleProcess = async () => {
        if (!pdfRef || selectedPages.length === 0) return;
        setIsProcessing(true);
        const loadingToast = toast.loading("Generating customized PDF...");

        try {
            // Orientation switching
            const orient = layout.orientation === 'portrait' ? 'p' : 'l';
            const doc = new jsPDF({
                orientation: orient,
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;

            // Grid logic
            const numRows = layout.slidesPerRow;
            const numCols = layout.slidesPerCol;

            const cellWidth = (pageWidth - (margin * 2)) / numCols;
            const cellHeight = (pageHeight - (margin * 2)) / numRows;

            let currentSlot = 0;
            const slotsPerPage = numRows * numCols;

            for (let i = 0; i < selectedPages.length; i++) {
                const pageNum = selectedPages[i];

                const canvas = await renderPageToCanvas(pdfRef, pageNum, 2.0);
                if (!canvas) continue;

                // Apply logic
                const activeFilters = { ...filters };
                if (isBlackAndWhite) {
                    activeFilters.grayscale = true;
                    activeFilters.contrast = 150;
                }
                applyFiltersToCanvas(canvas, activeFilters, isLogoRemovalEnabled ? logoRegion : undefined);

                const imgData = canvas.toDataURL('image/jpeg', 0.85);

                // Slot calculation
                // Row-major order: (0,0), (0,1)...
                const slotInPage = currentSlot % slotsPerPage;
                const rowIndex = Math.floor(slotInPage / numCols);
                const colIndex = slotInPage % numCols;

                const x = margin + (colIndex * cellWidth);
                const y = margin + (rowIndex * cellHeight);

                // Fit Logic
                const imgRatio = canvas.width / canvas.height;
                const cellRatio = cellWidth / cellHeight;
                let finalW = cellWidth;
                let finalH = cellHeight;

                // If image is wider than cell (relative to ratio), fit width
                if (imgRatio > cellRatio) {
                    finalH = finalW / imgRatio;
                } else {
                    finalW = finalH * imgRatio;
                }

                // Center in cell
                const offX = (cellWidth - finalW) / 2;
                const offY = (cellHeight - finalH) / 2;

                doc.addImage(imgData, 'JPEG', x + offX, y + offY, finalW, finalH);

                if (layout.showSeparationLines) {
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(x, y, cellWidth, cellHeight);
                }

                currentSlot++;

                // New Page if full, but not after the very last image
                if (currentSlot % slotsPerPage === 0 && i < selectedPages.length - 1) {
                    doc.addPage();
                }
            }

            doc.save("class-notes-master.pdf");
            toast.success("Done!", { id: loadingToast });
        } catch (e) {
            console.error(e);
            toast.error("Error creating PDF", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <ToolLayout
            title="Class Notes Print"
            description="Format lecture slides for printing. Invert colors, remove black backgrounds, and print multiple slides per page."
            icon={<FileText className="w-10 h-10 text-purple-400" />}
        >
            {/* Step 0: Upload */}
            {step === 0 && (
                <div className="max-w-3xl mx-auto space-y-8">
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        title="Select Lecture Slides PDF"
                        className="h-80 border-purple-500/20 hover:border-purple-500/50"
                    />
                </div>
            )}

            {/* Step 1: Page Selection */}
            {step === 1 && (
                <PageSelector
                    pdf={pdfRef}
                    selectedPages={selectedPages}
                    onSelectionChange={setSelectedPages}
                    onNext={handlePageSelectionNext}
                    onBack={() => setStep(0)}
                />
            )}

            {/* Step 2: Main Configuration */}
            {step === 2 && (
                <div className="space-y-8">

                    {/* Top Section: Controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Column 1: Enhancement & Logo */}
                        <div className="space-y-6">

                            {/* Enhancement Panel */}
                            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 space-y-6 h-full">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                        <Wand2 className="w-5 h-5 text-purple-400" /> Enhancement
                                    </h3>

                                    <div className="space-y-3">
                                        {/* Invert */}
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-medium text-slate-200">Invert Colors</p>
                                                <p className="text-xs text-slate-500">Dark to light</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={filters.invert}
                                                onChange={(e) => setFilters({ ...filters, invert: e.target.checked })}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                        {/* Clear BG */}
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-medium text-slate-200">Clear PDF Background</p>
                                                <p className="text-xs text-slate-500">Remove background noise</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={filters.removeBackground}
                                                onChange={(e) => setFilters({ ...filters, removeBackground: e.target.checked })}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                        {/* Grayscale */}
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-medium text-slate-200">Grayscale</p>
                                                <p className="text-xs text-slate-500">Shades of gray</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={filters.grayscale}
                                                onChange={(e) => setFilters({ ...filters, grayscale: e.target.checked })}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                        {/* B&W */}
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-medium text-slate-200">Black & White</p>
                                                <p className="text-xs text-slate-500">Pure black & white</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isBlackAndWhite}
                                                onChange={(e) => setIsBlackAndWhite(e.target.checked)}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* Remove Logo Section merged in */}
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                        <Trash2 className="w-5 h-5 text-purple-400" /> Remove Logo
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <span className="font-medium text-slate-200">Enable Logo Removal</span>
                                            <input
                                                type="checkbox"
                                                checked={isLogoRemovalEnabled}
                                                onChange={(e) => {
                                                    setIsLogoRemovalEnabled(e.target.checked);
                                                    if (e.target.checked && !logoRegion) setShowLogoModal(true);
                                                }}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                        {isLogoRemovalEnabled && (
                                            <button
                                                onClick={() => setShowLogoModal(true)}
                                                className="w-full py-2 bg-slate-800 text-purple-400 text-sm font-medium rounded-lg border border-purple-500/20 hover:bg-slate-700 transition"
                                            >
                                                Adjust Logo Region
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Column 2: Layout Controls */}
                        <div className="space-y-6">
                            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 space-y-6 h-full">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-purple-400" /> Layout
                                </h3>

                                {/* Document Size */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Document Size</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.pageSize === 'original' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, pageSize: 'original' })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.pageSize === 'original' ? 'fill-current' : ''}`} />
                                            Original
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.pageSize === 'a4' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, pageSize: 'a4' })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.pageSize === 'a4' ? 'fill-current' : ''}`} />
                                            A4
                                        </button>
                                    </div>
                                </div>

                                {/* Orientation */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Orientation</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.orientation === 'portrait' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, orientation: 'portrait' })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.orientation === 'portrait' ? 'fill-current' : ''}`} />
                                            Portrait
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.orientation === 'landscape' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, orientation: 'landscape' })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.orientation === 'landscape' ? 'fill-current' : ''}`} />
                                            Landscape
                                        </button>
                                    </div>
                                </div>

                                {/* Slides Per Page (Rows / Cols) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Slides per Page</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-xs text-slate-500 mb-1 block">Rows</span>
                                            <select
                                                value={layout.slidesPerRow}
                                                onChange={(e) => setLayout({ ...layout, slidesPerRow: Number(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 mb-1 block">Columns</span>
                                            <select
                                                value={layout.slidesPerCol}
                                                onChange={(e) => setLayout({ ...layout, slidesPerCol: Number(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Separation Lines */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Add Separation Lines</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${!layout.showSeparationLines ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, showSeparationLines: false })}
                                        >
                                            <Circle className={`w-4 h-4 ${!layout.showSeparationLines ? 'fill-current' : ''}`} />
                                            No
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.showSeparationLines ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, showSeparationLines: true })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.showSeparationLines ? 'fill-current' : ''}`} />
                                            Yes
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>


                    {/* Bottom Section: Preview & Actions - Full Width */}
                    <div className="space-y-6 border-t border-white/10 pt-8">

                        <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 min-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-purple-400" /> Layout Preview
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-400">Previewing Page:</span>
                                    <select
                                        value={previewPage}
                                        onChange={(e) => setPreviewPage(Number(e.target.value))}
                                        className="bg-slate-950 text-sm border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:border-purple-500 outline-none"
                                    >
                                        {selectedPages.map(p => (
                                            <option key={p} value={p}>Page {p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-950 rounded-xl border border-white/10 relative flex items-center justify-center p-8 overflow-hidden min-h-[400px]">
                                <canvas
                                    ref={previewCanvasRef}
                                    className="max-w-full max-h-[600px] object-contain shadow-2xl border border-slate-800"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-4 text-slate-400 hover:text-white transition flex items-center justify-center gap-2 hover:bg-white/5 rounded-xl"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Selection
                            </button>

                            <button
                                onClick={handleProcess}
                                disabled={isProcessing}
                                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 transition disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-6 h-6" />
                                        Download Optimized PDF
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Step 3: Modals */}
            <InteractiveLogoRemover
                pdf={pdfRef}
                isOpen={showLogoModal}
                onClose={() => setShowLogoModal(false)}
                onApply={(region) => {
                    setLogoRegion(region);
                    setShowLogoModal(false);
                    setIsLogoRemovalEnabled(true);
                }}
                initialRegion={logoRegion}
            />

        </ToolLayout>
    );
}
