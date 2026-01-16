"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Check, X, Move, ChevronLeft, ChevronRight, type LucideIcon, Type, Palette, Scaling } from "lucide-react";
import toast from "react-hot-toast";

interface TextOverlay {
    id: string;
    text: string;
    xPercent: number; // 0-100
    yPercent: number; // 0-100
    size: number;
    color: string;
    pageNum: number; // 1-based
}

interface PdfEditorProps {
    file: File;
    onProcess: (edits: TextOverlay[]) => void;
    onBack: () => void;
}

export default function PdfEditor({ file, onProcess, onBack }: PdfEditorProps) {
    const [pdfLib, setPdfLib] = useState<any>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<any>(null);

    // Edits
    const [confirmedTexts, setConfirmedTexts] = useState<TextOverlay[]>([]);

    // Pending Text (Being placed)
    const [pendingText, setPendingText] = useState<TextOverlay | null>(null);

    // Input State
    const [inputText, setInputText] = useState("");
    const [inputSize, setInputSize] = useState(24);
    const [inputColor, setInputColor] = useState("#000000");
    const [targetPage, setTargetPage] = useState(1);
    const [viewportScale, setViewportScale] = useState(1);

    // Dragging State
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

    // Initialize PDF
    useEffect(() => {
        const load = async () => {
            try {
                const pdfjs = await import("pdfjs-dist");
                if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                }
                setPdfLib(pdfjs);

                const arrayBuffer = await file.arrayBuffer();
                const doc = await pdfjs.getDocument(arrayBuffer).promise;
                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load PDF");
            }
        };
        load();
    }, [file]);

    // Render Page
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

        const render = async () => {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            try {
                const containerWidth = containerRef.current?.clientWidth || 800;

                const page = await pdfDoc.getPage(currentPage);
                const viewport = page.getViewport({ scale: 1 });
                const desiredWidth = containerWidth - 48; // Padding
                const scale = desiredWidth / viewport.width;

                const scaledViewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas) return;

                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const renderTask = page.render({ canvasContext: ctx, viewport: scaledViewport });
                    renderTaskRef.current = renderTask;
                    await renderTask.promise;
                    setViewportScale(scale);
                }
            } catch (error) {
                if ((error as any).name !== 'RenderingCancelledException') {
                    console.error("Render error", error);
                }
            }
        };
        render(); // Debounce?
    }, [pdfDoc, currentPage, containerRef.current?.clientWidth]);

    const handleAddPending = () => {
        if (!inputText.trim()) {
            toast.error("Please enter some text");
            return;
        }

        // Switch to the target page if different
        if (targetPage !== currentPage) {
            setCurrentPage(targetPage);
        }

        setPendingText({
            id: Date.now().toString(),
            text: inputText,
            size: inputSize,
            color: inputColor,
            pageNum: targetPage,
            xPercent: 50, // Center
            yPercent: 50
        });
    };

    const handleConfirmPlacement = () => {
        if (pendingText) {
            setConfirmedTexts([...confirmedTexts, pendingText]);
            setPendingText(null);
            setInputText("");
            toast.success("Text Added!");
        }
    };

    const handleCancelPlacement = () => {
        setPendingText(null);
    };

    // Drag Logic
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!pendingText) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !pendingText || !containerRef.current || !canvasRef.current) return;

        // Only prevent default if we are dragging inside the canvas area (controlled by isDragging)
        // But preventing default on document level might be tricky.
        // We attached listener to container.

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - dragStartRef.current.x;
        const deltaY = clientY - dragStartRef.current.y;

        // Convert delta pixels to percentage based on canvas size
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const percentDeltaX = (deltaX / canvasRect.width) * 100;
        const percentDeltaY = (deltaY / canvasRect.height) * 100;

        setPendingText(prev => prev ? ({
            ...prev,
            xPercent: Math.max(0, Math.min(100, prev.xPercent + percentDeltaX)),
            yPercent: Math.max(0, Math.min(100, prev.yPercent + percentDeltaY))
        }) : null);

        dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div className="flex flex-col-reverse lg:flex-row h-[calc(100vh-140px)] gap-4 lg:gap-6" onMouseUp={handleDragEnd} onMouseMove={handleDragMove} onTouchEnd={handleDragEnd} onTouchMove={handleDragMove}>
            {/* Sidebar Controls */}
            <div className="w-full lg:w-80 flex-shrink-0 bg-slate-900/50 rounded-2xl border border-white/5 p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 overflow-y-auto custom-scrollbar max-h-[40vh] lg:max-h-full">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">Write Text on PDF</h3>
                    <button onClick={onBack} className="text-sm text-slate-400 hover:text-white">Change File</button>
                </div>

                {pendingText ? (
                    // Placement Mode Controls
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4">
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                            <h4 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
                                <Move className="w-4 h-4" /> Place Text
                            </h4>
                            <p className="text-sm text-slate-300 mb-4">
                                Drag the text on the preview to position it.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleConfirmPlacement}
                                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                                >
                                    <Check className="w-5 h-5" /> Confirm Position (OK)
                                </button>
                                <button
                                    onClick={handleCancelPlacement}
                                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition"
                                >
                                    <X className="w-5 h-5" /> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Input Mode Controls
                    <div className="flex flex-col gap-6">
                        {/* Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Text Content</label>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Enter text here..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white h-24 resize-none focus:ring-2 focus:ring-cyan-500 outline-none"
                            />
                        </div>

                        {/* Formatting */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Scaling className="w-3 h-3" /> Size</label>
                                <input
                                    type="number"
                                    value={inputSize}
                                    onChange={(e) => setInputSize(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Palette className="w-3 h-3" /> Color</label>
                                <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-lg p-1 pr-3">
                                    <input
                                        type="color"
                                        value={inputColor}
                                        onChange={(e) => setInputColor(e.target.value)}
                                        className="w-8 h-8 rounded bg-transparent cursor-pointer"
                                    />
                                    <span className="text-xs text-slate-400 font-mono">{inputColor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Page Select - Dropdown */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Target Page</label>
                            <select
                                value={targetPage}
                                onChange={(e) => setTargetPage(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            >
                                {Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
                                    <option key={p} value={p}>Page {p}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleAddPending}
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition"
                        >
                            Next (Place Text)
                        </button>
                    </div>
                )}

                <div className="mt-auto border-t border-white/10 pt-6">
                    <button
                        onClick={() => onProcess(confirmedTexts)}
                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                        disabled={confirmedTexts.length === 0}
                    >
                        Save PDF
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-2">{confirmedTexts.length} edits added</p>
                </div>
            </div>

            {/* Preview Area */}
            <div ref={containerRef} className="flex-1 bg-slate-950/50 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">
                {/* Canvas Container */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-6 relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
                            <span className="text-slate-400">Loading PDF...</span>
                        </div>
                    ) : (
                        <div className="relative shadow-2xl">
                            <canvas ref={canvasRef} className="max-w-full" />

                            {/* Render Confirmed Texts for this page */}
                            {confirmedTexts.filter(t => t.pageNum === currentPage).map(item => (
                                <div
                                    key={item.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{
                                        left: `${item.xPercent}%`,
                                        top: `${item.yPercent}%`,
                                        color: item.color,
                                        fontSize: `${item.size * viewportScale}px`,
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1
                                    }}
                                >
                                    {item.text}
                                </div>
                            ))}

                            {/* Render Pending Text */}
                            {pendingText && pendingText.pageNum === currentPage && (
                                <div
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-dashed border-cyan-500 bg-cyan-500/10 p-1 select-none ${isDragging ? 'opacity-80' : 'opacity-100'}`}
                                    style={{
                                        left: `${pendingText.xPercent}%`,
                                        top: `${pendingText.yPercent}%`,
                                        color: pendingText.color,
                                        fontSize: `${pendingText.size * viewportScale}px`,
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1
                                    }}
                                >
                                    {pendingText.text}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Page Navigation Overlay */}
                <div className="bg-slate-900/90 border-t border-white/5 p-4 flex items-center justify-center gap-4 backdrop-blur">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-white font-medium">Page {currentPage} of {numPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                        disabled={currentPage >= numPages}
                        className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
