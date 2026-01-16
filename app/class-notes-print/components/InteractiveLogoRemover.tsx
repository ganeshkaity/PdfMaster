"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { X, Check } from "lucide-react";
import { renderPageToCanvas, LogoRegion } from "../../utils/class-notes-utils";

import { CropRegion } from "./PageEditModal";

interface InteractiveLogoRemoverProps {
    pdf: any; // PDF Document Proxy
    isOpen: boolean;
    onClose: () => void;
    onApply: (region: LogoRegion) => void;
    initialRegion?: LogoRegion;
    pageEdits: Record<number, string>;
    pageRotations: Record<number, number>;
    pageCrops: Record<number, CropRegion>;
}

export default function InteractiveLogoRemover({ pdf, isOpen, onClose, onApply, initialRegion, pageEdits, pageRotations, pageCrops }: InteractiveLogoRemoverProps) {
    const [pageNumber, setPageNumber] = useState(1);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [currentRegion, setCurrentRegion] = useState<LogoRegion | null>(null);

    // Initial load & Default Region
    useEffect(() => {
        if (!isOpen || !pdf) return;
        renderPage(pageNumber);

        // Auto-select default region if none exists
        if (!currentRegion && !initialRegion) {
            setCurrentRegion({ x: 90, y: 0, width: 9.5, height: 15 }); // Default to top-right corner
        } else if (initialRegion && !currentRegion) {
            setCurrentRegion(initialRegion);
        }
    }, [isOpen, pageNumber, pdf]);

    // Render logic (Background PDF)
    const renderPage = async (num: number) => {
        if (!canvasRef.current || !pdf) return;

        const rotation = pageRotations[num] || 0;
        const crop = pageCrops[num];
        const editedImgData = pageEdits[num];

        let canvas: HTMLCanvasElement | null = null;

        if (editedImgData) {
            // Use edited image
            const img = new Image();
            img.src = editedImgData;
            await new Promise((resolve) => { img.onload = resolve; });

            const baseCanvas = document.createElement('canvas');
            baseCanvas.width = img.width;
            baseCanvas.height = img.height;
            const baseCtx = baseCanvas.getContext('2d');
            baseCtx?.drawImage(img, 0, 0);

            if (crop) {
                const croppedCanvas = document.createElement('canvas');
                const cw = (crop.width / 100) * baseCanvas.width;
                const ch = (crop.height / 100) * baseCanvas.height;
                const cx = (crop.x / 100) * baseCanvas.width;
                const cy = (crop.y / 100) * baseCanvas.height;

                croppedCanvas.width = cw;
                croppedCanvas.height = ch;
                const croppedCtx = croppedCanvas.getContext('2d');
                croppedCtx?.drawImage(baseCanvas, cx, cy, cw, ch, 0, 0, cw, ch);
                canvas = croppedCanvas;
            } else {
                canvas = baseCanvas;
            }
        } else {
            // Render from PDF with rotation/crop
            canvas = await renderPageToCanvas(pdf, num, 1.5, rotation, crop);
        }

        if (canvas) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                canvasRef.current.width = canvas.width;
                canvasRef.current.height = canvas.height;
                ctx.drawImage(canvas, 0, 0);

                // Match overlay size
                if (overlayRef.current) {
                    overlayRef.current.width = canvas.width;
                    overlayRef.current.height = canvas.height;
                    drawOverlay(currentRegion); // Redraw overlay if region exists
                }
            }
        }
    };


    // Draw Overlay (Selection Box)
    const drawOverlay = (region: LogoRegion | null) => {
        const overlay = overlayRef.current;
        if (!overlay) return;
        const ctx = overlay.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (region) {
            const x = (region.x / 100) * overlay.width;
            const y = (region.y / 100) * overlay.height;
            const w = (region.width / 100) * overlay.width;
            const h = (region.height / 100) * overlay.height;

            // Dim background
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(0, 0, overlay.width, overlay.height);

            // Clear the selection area
            ctx.clearRect(x, y, w, h);

            // Draw border
            ctx.strokeStyle = "#f21743ff"; // red
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            // Draw Drag Handle Indicator (Center Crosshair or similar) to imply draggable
            ctx.beginPath();
            ctx.moveTo(x + w / 2 - 5, y + h / 2);
            ctx.lineTo(x + w / 2 + 5, y + h / 2);
            ctx.moveTo(x + w / 2, y + h / 2 - 5);
            ctx.lineTo(x + w / 2, y + h / 2 + 5);
            ctx.strokeStyle = "rgba(242, 23, 67, 0.5)";
            ctx.stroke();
        }
    };

    // Update overlay when region changes
    useEffect(() => {
        drawOverlay(currentRegion);
    }, [currentRegion]);


    // Mouse & Touch Events
    const getCoords = (e: MouseEvent | TouchEvent) => {
        if (!overlayRef.current) return { x: 0, y: 0 };
        const rect = overlayRef.current.getBoundingClientRect();

        let clientX = 0;
        let clientY = 0;

        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * (overlayRef.current.width / rect.width),
            y: (clientY - rect.top) * (overlayRef.current.height / rect.height)
        };
    };

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
        if (!currentRegion || !overlayRef.current) return;

        // Prevent scrolling on touch
        // e.preventDefault() might be needed but can't be called on React SyntheticEvent in some cases for passive listeners?
        // React 18 handles this better usually. But let's try just logic first.

        const { x, y } = getCoords(e);
        const w = overlayRef.current.width;
        const h = overlayRef.current.height;

        // Convert mouse to %
        const mx = (x / w) * 100;
        const my = (y / h) * 100;

        // Hit Test
        if (mx >= currentRegion.x && mx <= currentRegion.x + currentRegion.width &&
            my >= currentRegion.y && my <= currentRegion.y + currentRegion.height) {

            setIsDragging(true);
            setDragOffset({
                x: mx - currentRegion.x,
                y: my - currentRegion.y
            });
        }
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        const { x, y } = getCoords(e);

        // Change cursor if hovering over box
        if (overlayRef.current && currentRegion) {
            const w = overlayRef.current.width;
            const h = overlayRef.current.height;
            const mx = (x / w) * 100;
            const my = (y / h) * 100;

            if (mx >= currentRegion.x && mx <= currentRegion.x + currentRegion.width &&
                my >= currentRegion.y && my <= currentRegion.y + currentRegion.height) {
                overlayRef.current.style.cursor = "move";
            } else {
                overlayRef.current.style.cursor = "default";
            }
        }

        if (!isDragging || !currentRegion || !overlayRef.current) return;

        const w = overlayRef.current.width;
        const h = overlayRef.current.height;
        const mx = (x / w) * 100;
        const my = (y / h) * 100;

        // Calculate new pos
        let newX = mx - dragOffset.x;
        let newY = my - dragOffset.y;

        // Clamp
        newX = Math.max(0, Math.min(100 - currentRegion.width, newX));
        newY = Math.max(0, Math.min(100 - currentRegion.height, newY));

        setCurrentRegion({
            ...currentRegion,
            x: newX,
            y: newY
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pt-24 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">Select Logo Region</h3>
                        <p className="text-slate-400 text-sm">Drag the box to cover the logo you want to remove.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={pageNumber}
                            onChange={(e) => setPageNumber(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-cyan-500"
                        >
                            {pdf && Array.from({ length: pdf.numPages }, (_, i) => (
                                <option key={i + 1} value={i + 1}>Page {i + 1}</option>
                            ))}
                        </select>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto p-8 bg-slate-950 flex items-center justify-center cursor-crosshair">
                    <div className="relative shadow-2xl mt-20">
                        <canvas ref={canvasRef} className="block max-w-full" style={{ maxHeight: '55vh' }} />
                        <canvas
                            ref={overlayRef}
                            className="absolute inset-0 w-full h-full touch-none"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleMouseDown}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleMouseUp}
                        />
                    </div>
                </div>

                {/* Footer & Controls */}
                <div className="p-4 border-t border-white/10 bg-slate-900 rounded-b-2xl space-y-4">

                    {/* Manual Controls */}
                    {currentRegion ? (
                        <div className="grid grid-cols-4 gap-4 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                            <div>
                                <label className="text-xs text-slate-500 font-medium ml-1">X Position (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={currentRegion.x.toFixed(1)}
                                    onChange={(e) => setCurrentRegion({ ...currentRegion, x: Number(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium ml-1">Y Position (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={currentRegion.y.toFixed(1)}
                                    onChange={(e) => setCurrentRegion({ ...currentRegion, y: Number(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium ml-1">Width (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={currentRegion.width.toFixed(1)}
                                    onChange={(e) => setCurrentRegion({ ...currentRegion, width: Number(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium ml-1">Height (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={currentRegion.height.toFixed(1)}
                                    onChange={(e) => setCurrentRegion({ ...currentRegion, height: Number(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none mt-1"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 text-sm py-2">
                            Draw a box on the image above to select a region.
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition">Cancel</button>
                        <button
                            onClick={() => currentRegion && onApply(currentRegion)}
                            disabled={!currentRegion}
                            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                        >
                            <Check className="w-4 h-4" />
                            Apply Selection
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
