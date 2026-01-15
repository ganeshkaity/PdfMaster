"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { X, Check, RotateCw, RotateCcw, Image, Search } from "lucide-react";
import { renderPageToCanvas, LogoRegion } from "../../utils/class-notes-utils";

// Define CropRegion same as LogoRegion for now (x, y, w, h in percentages)
export type CropRegion = LogoRegion;

interface PageEditModalProps {
    pdf: any;
    pageNumber: number;
    initialRotation: number;
    initialCrop?: CropRegion;
    isOpen: boolean;
    onClose: () => void;
    onApply: (rotation: number, crop?: CropRegion) => void;
}

export default function PageEditModal({ pdf, pageNumber, initialRotation, initialCrop, isOpen, onClose, onApply }: PageEditModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState(initialRotation);
    const [crop, setCrop] = useState<CropRegion | null>(initialCrop || null);

    // Interaction State
    const [interaction, setInteraction] = useState<{
        type: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'resize-t' | 'resize-b' | 'resize-l' | 'resize-r' | 'none';
        startX: number;
        startY: number;
        startCrop: CropRegion;
    }>({ type: 'none', startX: 0, startY: 0, startCrop: { x: 0, y: 0, width: 0, height: 0 } });

    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            setRotation(initialRotation);
            setCrop(initialCrop || null); // Reset or use initial
        }
    }, [isOpen, initialRotation, initialCrop, pageNumber]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            // Cleanup function
            return () => {
                const scrollY = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
            };
        }
    }, [isOpen]);

    // Redraw when Rotation or Page changes
    useEffect(() => {
        if (!isOpen || !pdf) return;
        renderCanvas();
    }, [isOpen, pageNumber, pdf, rotation]);

    // Redraw Overlay when Crop changes
    useEffect(() => {
        drawOverlay();
    }, [crop]);

    const renderCanvas = async () => {
        if (!canvasRef.current || !overlayRef.current) return;

        // Render with rotation!
        const canvas = await renderPageToCanvas(pdf, pageNumber, 1.5, rotation);
        if (canvas) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                canvasRef.current.width = canvas.width;
                canvasRef.current.height = canvas.height;
                ctx.drawImage(canvas, 0, 0);

                // Sync overlay size
                overlayRef.current.width = canvas.width;
                overlayRef.current.height = canvas.height;

                // Initialize crop to full page if null, OR don't show any if we want optional crop
                // User prompt implies we want to CROP, so maybe init default usually?
                // For now, let's keep it null until they start cropping or select a preset, 
                // OR initialize to 90% view if that's better. Let's start null (full page)
                drawOverlay();
            }
        }
    };

    const drawOverlay = () => {
        const canvas = overlayRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Darken background
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!crop) {
            // If no crop defined, maybe show full page as "selected" visually or nothing?
            // If dragging "handles" on full page...
            // Let's default: If crop is null, we show the WHOLE page as clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const w = canvas.width;
        const h = canvas.height;

        const xPx = (crop.x / 100) * w;
        const yPx = (crop.y / 100) * h;
        const wPx = (crop.width / 100) * w;
        const hPx = (crop.height / 100) * h;

        // Clear the crop region (make it transparent)
        ctx.clearRect(xPx, yPx, wPx, hPx);

        // Draw Border
        ctx.strokeStyle = "#06b6d4"; // cyan-500
        ctx.lineWidth = 2;
        ctx.strokeRect(xPx, yPx, wPx, hPx);

        // Draw Grid (Rule of Thirds)
        ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Verticals
        ctx.moveTo(xPx + wPx / 3, yPx);
        ctx.lineTo(xPx + wPx / 3, yPx + hPx);
        ctx.moveTo(xPx + (wPx * 2) / 3, yPx);
        ctx.lineTo(xPx + (wPx * 2) / 3, yPx + hPx);
        // Horizontals
        ctx.moveTo(xPx, yPx + hPx / 3);
        ctx.lineTo(xPx + wPx, yPx + hPx / 3);
        ctx.moveTo(xPx, yPx + (hPx * 2) / 3);
        ctx.lineTo(xPx + wPx, yPx + (hPx * 2) / 3);
        ctx.stroke();

        // Draw Handles
        const handleSize = 8;
        ctx.fillStyle = "#ffffff";

        // Corners
        const drawHandle = (hx: number, hy: number) => {
            ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        };

        drawHandle(xPx, yPx); // TL
        drawHandle(xPx + wPx, yPx); // TR
        drawHandle(xPx, yPx + hPx); // BL
        drawHandle(xPx + wPx, yPx + hPx); // BR

        // Midpoints
        drawHandle(xPx + wPx / 2, yPx); // Top
        drawHandle(xPx + wPx / 2, yPx + hPx); // Bottom
        drawHandle(xPx, yPx + hPx / 2); // Left
        drawHandle(xPx + wPx, yPx + hPx / 2); // Right
    };

    // --- Interaction Logic ---
    const getEvtPos = (e: MouseEvent) => {
        if (!overlayRef.current) return { x: 0, y: 0 };
        const rect = overlayRef.current.getBoundingClientRect();
        const scaleX = overlayRef.current.width / rect.width;
        const scaleY = overlayRef.current.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (!crop || !overlayRef.current) {
            // New Crop Init on Drag if null?
            // Or just initiate crop as full then resize? 
            // Let's auto-init crop to full 90% center if they click to start
            if (!crop) {
                const init: CropRegion = { x: 10, y: 10, width: 80, height: 80 };
                setCrop(init);
                // Can't drag immediately this frame easily without specialized logic, 
                // so just init crop for now. 
                return;
            }
            return;
        }

        const { x, y } = getEvtPos(e);
        const w = overlayRef.current.width;
        const h = overlayRef.current.height;

        const xPx = (crop.x / 100) * w;
        const yPx = (crop.y / 100) * h;
        const wPx = (crop.width / 100) * w;
        const hPx = (crop.height / 100) * h;

        const handleSize = 15; // Increased hit area for easier grabbing
        const hit = (hx: number, hy: number) => Math.abs(x - hx) <= handleSize && Math.abs(y - hy) <= handleSize;

        // Check Handles
        if (hit(xPx, yPx)) setInteraction({ type: 'resize-tl', startX: x, startY: y, startCrop: crop });
        else if (hit(xPx + wPx, yPx)) setInteraction({ type: 'resize-tr', startX: x, startY: y, startCrop: crop });
        else if (hit(xPx, yPx + hPx)) setInteraction({ type: 'resize-bl', startX: x, startY: y, startCrop: crop });
        else if (hit(xPx + wPx, yPx + hPx)) setInteraction({ type: 'resize-br', startX: x, startY: y, startCrop: crop });
        // Mids
        else if (hit(xPx + wPx / 2, yPx)) setInteraction({ type: 'resize-t', startX: x, startY: y, startCrop: crop });
        else if (hit(xPx + wPx / 2, yPx + hPx)) setInteraction({ type: 'resize-b', startX: x, startY: y, startCrop: crop });
        else if (hit(xPx, yPx + hPx / 2)) setInteraction({ type: 'resize-l', startX: x, startY: y, startCrop: crop });
        else if (hit(xPx + wPx, yPx + hPx / 2)) setInteraction({ type: 'resize-r', startX: x, startY: y, startCrop: crop });
        // Body (Move)
        else if (x >= xPx && x <= xPx + wPx && y >= yPx && y <= yPx + hPx) {
            setInteraction({ type: 'move', startX: x, startY: y, startCrop: crop });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (interaction.type === 'none' || !crop || !overlayRef.current) return;

        const { x, y } = getEvtPos(e);
        const dx = x - interaction.startX;
        const dy = y - interaction.startY;

        const wCanvas = overlayRef.current.width;
        const hCanvas = overlayRef.current.height;

        // Convert px delta to % delta
        const dxPct = (dx / wCanvas) * 100;
        const dyPct = (dy / hCanvas) * 100;

        let newCrop = { ...interaction.startCrop };

        // Helper to Clamp 
        const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

        switch (interaction.type) {
            case 'move':
                newCrop.x = clamp(newCrop.x + dxPct, 0, 100 - newCrop.width);
                newCrop.y = clamp(newCrop.y + dyPct, 0, 100 - newCrop.height);
                break;
            case 'resize-tl':
                newCrop.x += dxPct; newCrop.width -= dxPct;
                newCrop.y += dyPct; newCrop.height -= dyPct;
                break;
            case 'resize-tr':
                newCrop.y += dyPct; newCrop.height -= dyPct;
                newCrop.width += dxPct;
                break;
            case 'resize-bl':
                newCrop.x += dxPct; newCrop.width -= dxPct;
                newCrop.height += dyPct;
                break;
            case 'resize-br':
                newCrop.width += dxPct;
                newCrop.height += dyPct;
                break;
            case 'resize-t':
                newCrop.y += dyPct; newCrop.height -= dyPct;
                break;
            case 'resize-b':
                newCrop.height += dyPct;
                break;
            case 'resize-l':
                newCrop.x += dxPct; newCrop.width -= dxPct;
                break;
            case 'resize-r':
                newCrop.width += dxPct;
                break;
        }

        // Sanity Check Width/Height > Min
        if (newCrop.width < 5) newCrop.width = 5;
        if (newCrop.height < 5) newCrop.height = 5;

        // Sanity Check Bounds (simplified, preventing negative width expansion issues could be complex, keeping simple)
        if (newCrop.x < 0) newCrop.x = 0;
        if (newCrop.y < 0) newCrop.y = 0;
        if (newCrop.x + newCrop.width > 100) newCrop.width = 100 - newCrop.x;
        if (newCrop.y + newCrop.height > 100) newCrop.height = 100 - newCrop.y;

        setCrop(newCrop);
    };

    const handleMouseUp = () => {
        setInteraction({ type: 'none', startX: 0, startY: 0, startCrop: { x: 0, y: 0, width: 0, height: 0 } });
    };


    // Presets
    const applyPreset = (ratio: number | null) => {
        // Ratio = Width / Height. e.g. 16:9 = 1.77
        if (!ratio) {
            setCrop(null); // Reset
            return;
        }

        // Fit centered box with ratio
        // Default size: 80% width or height
        const margin = 10;

        let newW = 80;
        let newH = 80;

        // Start with square 80x80 relative to canvas aspect?? 
        // No, ratio is dimensional. 
        // We need canvas Aspect Ratio to determine percentages
        if (!canvasRef.current) return;
        const canvasAspect = canvasRef.current.width / canvasRef.current.height;

        // We want (W_px / H_px) = target_ratio
        // (nw * CW) / (nh * CH) = R
        // nw/nh * (CW/CH) = R
        // nw/nh = R / A_canv

        // Let's act as if we want a crop that is centred.
        // Try setting H=80%
        // H_pct = 80.
        // W_pct = 80 * (R / A_canv)

        const targetPctRatio = ratio / canvasAspect;

        newH = 70;
        newW = 70 * targetPctRatio;

        if (newW > 90) {
            // Too wide, constrain width
            newW = 90;
            newH = 90 / targetPctRatio;
        }

        const newX = (100 - newW) / 2;
        const newY = (100 - newH) / 2;

        setCrop({ x: newX, y: newY, width: newW, height: newH });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-5 pt-16 sm:pt-20">
            <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-5xl h-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-14 sm:h-16 border-b border-white/10 flex items-center justify-between px-3 sm:px-6 bg-slate-950/50">
                    <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                        <Image className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" /> <span className="hidden sm:inline">Edit Page {pageNumber}</span><span className="sm:hidden">Page {pageNumber}</span>
                    </h3>
                    <div className="flex gap-1 sm:gap-2">
                        <button onClick={() => setRotation(r => (r - 90 + 360) % 360)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-slate-300" title="Rotate Left">
                            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-slate-300" title="Rotate Right">
                            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>


                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                    {/* Preview & Crop - 65% on desktop */}
                    <div className="flex-1 lg:w-[65%] relative bg-slate-950/50 flex items-center justify-center p-3 sm:p-6 overflow-auto min-h-[300px] lg:min-h-0">
                        <div className="relative shadow-2xl lg:mt-32">
                            <canvas ref={canvasRef} className="max-w-full max-h-[40vh] sm:max-h-[50vh] lg:max-h-[75vh] object-contain block" />
                            <canvas
                                ref={overlayRef}
                                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            />
                        </div>
                    </div>

                    {/* Controls - 35% on desktop */}
                    <div className="w-full lg:w-[35%] border-t lg:border-l lg:border-t-0 border-white/10 bg-slate-900 overflow-y-auto p-4 sm:p-6 lg:pt-8 space-y-4 sm:space-y-6 max-h-[40vh] lg:max-h-none">

                        {/* Presets */}
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Crop Presets</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => applyPreset(1)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-white/5 transition">Square (1:1)</button>
                                <button onClick={() => applyPreset(16 / 9)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-white/5 transition">16:9</button>
                                <button onClick={() => applyPreset(4 / 3)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-white/5 transition">4:3</button>
                                <button onClick={() => applyPreset(3 / 4)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-white/5 transition">3:4</button>
                                <button onClick={() => setCrop(null)} className="px-3 py-2 bg-slate-800 hover:bg-red-500/20 text-red-300 border border-white/5 transition col-span-2">Reset Crop</button>
                            </div>
                        </div>

                        {/* Fine-tune Position Sliders */}
                        {crop && (
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Fine-tune Position</label>

                                {/* X Position */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Horizontal (X)</span>
                                        <span className="text-cyan-400 font-mono">{crop.x.toFixed(1)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={100 - crop.width}
                                        step="0.5"
                                        value={crop.x}
                                        onChange={(e) => setCrop({ ...crop, x: Number(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>

                                {/* Y Position */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Vertical (Y)</span>
                                        <span className="text-cyan-400 font-mono">{crop.y.toFixed(1)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={100 - crop.height}
                                        step="0.5"
                                        value={crop.y}
                                        onChange={(e) => setCrop({ ...crop, y: Number(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>

                                {/* Width */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Width</span>
                                        <span className="text-cyan-400 font-mono">{crop.width.toFixed(1)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max={100 - crop.x}
                                        step="0.5"
                                        value={crop.width}
                                        onChange={(e) => setCrop({ ...crop, width: Number(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>

                                {/* Height */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Height</span>
                                        <span className="text-cyan-400 font-mono">{crop.height.toFixed(1)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max={100 - crop.y}
                                        step="0.5"
                                        value={crop.height}
                                        onChange={(e) => setCrop({ ...crop, height: Number(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-200">
                            <strong>Tip:</strong> Drag corners/edges to resize. Drag center to move. Use sliders for precise control.
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="h-20 border-t border-white/10 flex items-center justify-end gap-4 px-6 bg-slate-950/50">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-400 hover:text-white font-medium transition">
                        Cancel
                    </button>
                    <button onClick={() => onApply(rotation, crop || undefined)} className="px-8 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition">
                        Apply Changes
                    </button>
                </div>

            </div>
        </div>
    );
}

