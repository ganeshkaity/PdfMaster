"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { X, Check, RotateCw, RotateCcw, Image, Undo2 } from "lucide-react";
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

    // Selection and Edit Controls
    const [enableCrop, setEnableCrop] = useState(!!initialCrop);
    const [selectionTool, setSelectionTool] = useState<'rectangle' | 'circle'>('rectangle');
    const [editAction, setEditAction] = useState<'invert' | 'paintBlack'>('invert');

    // Current selection being drawn
    const [currentSelection, setCurrentSelection] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
        tool: 'rectangle' | 'circle';
    } | null>(null);

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);

    // Edit history for undo
    const [editHistory, setEditHistory] = useState<ImageData[]>([]);

    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            setRotation(initialRotation);
            setCrop(initialCrop || null);
            setCurrentSelection(null);
            setEditHistory([]);
            setEnableCrop(!!initialCrop);
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

    // Redraw overlay when selection or crop changes
    useEffect(() => {
        drawOverlay();
    }, [currentSelection, crop]);

    // Animation loop for marching ants effect on crop box
    useEffect(() => {
        if (!enableCrop || !crop) return;

        let animationId: number;
        const animate = () => {
            drawOverlay();
            animationId = requestAnimationFrame(animate);
        };
        animationId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationId);
    }, [enableCrop, crop]);

    const renderCanvas = async () => {
        if (!canvasRef.current || !overlayRef.current) return;

        // Render with rotation
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

                // Save initial state for undo
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setEditHistory([imageData]);

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

        // Draw current selection with blue dashed border
        if (currentSelection) {
            const { x, y, width, height, tool } = currentSelection;

            // Dim the rest of the image
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clear the selection area
            ctx.clearRect(x, y, width, height);

            // Draw selection border (blue dashed)
            ctx.strokeStyle = '#3B82F6'; // Blue
            ctx.lineWidth = 5;
            ctx.setLineDash([8, 4]); // Dashed line

            if (tool === 'rectangle') {
                ctx.strokeRect(x, y, width, height);
            } else {
                // Circle
                const centerX = x + width / 2;
                const centerY = y + height / 2;
                const radius = Math.min(width, height) / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            }

            ctx.setLineDash([]); // Reset

            // Draw corner handles (small blue squares)
            const handleSize = 30;
            ctx.fillStyle = '#3B82F6';

            // Top-left
            ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            // Top-right
            ctx.fillRect(x + width - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            // Bottom-left
            ctx.fillRect(x - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);
            // Bottom-right
            ctx.fillRect(x + width - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);
        }

        // Draw crop box if enabled
        if (enableCrop && crop) {
            const xPx = (crop.x / 100) * canvas.width;
            const yPx = (crop.y / 100) * canvas.height;
            const wPx = (crop.width / 100) * canvas.width;
            const hPx = (crop.height / 100) * canvas.height;

            // Dim background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clear crop area
            ctx.clearRect(xPx, yPx, wPx, hPx);

            // Animated dashed border (marching ants)
            ctx.strokeStyle = '#00da3eff'; // Orange for crop
            ctx.lineWidth = 5;
            ctx.setLineDash([8, 4]); // Dashed line
            ctx.lineDashOffset = -(Date.now() / 20) % 12; // Animated offset
            ctx.strokeRect(xPx, yPx, wPx, hPx);
            ctx.setLineDash([]); // Reset

            // Draw handle dots (circles)
            const dotSize = 20;
            ctx.fillStyle = '#abe48aff';
            ctx.strokeStyle = '#04fa00ff';
            ctx.lineWidth = 2;

            const drawDot = (x: number, y: number) => {
                ctx.beginPath();
                ctx.arc(x, y, dotSize / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            };

            // 4 Corners
            drawDot(xPx, yPx); // Top-left
            drawDot(xPx + wPx, yPx); // Top-right
            drawDot(xPx, yPx + hPx); // Bottom-left
            drawDot(xPx + wPx, yPx + hPx); // Bottom-right

            // 4 Midpoints
            drawDot(xPx + wPx / 2, yPx); // Top-middle
            drawDot(xPx + wPx / 2, yPx + hPx); // Bottom-middle
            drawDot(xPx, yPx + hPx / 2); // Left-middle
            drawDot(xPx + wPx, yPx + hPx / 2); // Right-middle
        }
    };

    // --- Interaction Logic ---
    // Get coordinates from mouse or touch event
    const getCoords = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>): { x: number; y: number } => {
        if (!overlayRef.current) return { x: 0, y: 0 };
        const rect = overlayRef.current.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            // Touch event
            if (e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                return { x: 0, y: 0 };
            }
        } else {
            // Mouse event
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = overlayRef.current.width / rect.width;
        const scaleY = overlayRef.current.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };






    // Crop interaction state
    const [cropInteraction, setCropInteraction] = useState<{
        type: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'resize-t' | 'resize-b' | 'resize-l' | 'resize-r' | 'none';
        startX: number;
        startY: number;
        startCrop: CropRegion;
    }>({ type: 'none', startX: 0, startY: 0, startCrop: { x: 0, y: 0, width: 0, height: 0 } });

    // Selection interaction state
    const [selectionInteraction, setSelectionInteraction] = useState<{
        type: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'none';
        startX: number;
        startY: number;
        startSelection: { x: number; y: number; width: number; height: number; tool: 'rectangle' | 'circle' };
    }>({ type: 'none', startX: 0, startY: 0, startSelection: { x: 0, y: 0, width: 0, height: 0, tool: 'rectangle' } });

    // Start drawing selection or crop interaction
    const handlePointerDown = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
        const coords = getCoords(e);

        if (enableCrop) {
            // Crop mode: check if clicking on crop box to move/resize
            if (!crop || !overlayRef.current) {
                // Initialize crop if none exists
                const init: CropRegion = { x: 10, y: 10, width: 80, height: 80 };
                setCrop(init);
                return;
            }

            const w = overlayRef.current.width;
            const h = overlayRef.current.height;
            const xPx = (crop.x / 100) * w;
            const yPx = (crop.y / 100) * h;
            const wPx = (crop.width / 100) * w;
            const hPx = (crop.height / 100) * h;

            const handleSize = 20; // Larger hit area for touch
            const hit = (hx: number, hy: number) => Math.abs(coords.x - hx) <= handleSize && Math.abs(coords.y - hy) <= handleSize;

            // Check corner handles first
            if (hit(xPx, yPx)) {
                setCropInteraction({ type: 'resize-tl', startX: coords.x, startY: coords.y, startCrop: crop });
            } else if (hit(xPx + wPx, yPx)) {
                setCropInteraction({ type: 'resize-tr', startX: coords.x, startY: coords.y, startCrop: crop });
            } else if (hit(xPx, yPx + hPx)) {
                setCropInteraction({ type: 'resize-bl', startX: coords.x, startY: coords.y, startCrop: crop });
            } else if (hit(xPx + wPx, yPx + hPx)) {
                setCropInteraction({ type: 'resize-br', startX: coords.x, startY: coords.y, startCrop: crop });
            }
            // Check midpoint handles
            else if (hit(xPx + wPx / 2, yPx)) {
                setCropInteraction({ type: 'resize-t', startX: coords.x, startY: coords.y, startCrop: crop });
            } else if (hit(xPx + wPx / 2, yPx + hPx)) {
                setCropInteraction({ type: 'resize-b', startX: coords.x, startY: coords.y, startCrop: crop });
            } else if (hit(xPx, yPx + hPx / 2)) {
                setCropInteraction({ type: 'resize-l', startX: coords.x, startY: coords.y, startCrop: crop });
            } else if (hit(xPx + wPx, yPx + hPx / 2)) {
                setCropInteraction({ type: 'resize-r', startX: coords.x, startY: coords.y, startCrop: crop });
            } else if (coords.x >= xPx && coords.x <= xPx + wPx && coords.y >= yPx && coords.y <= yPx + hPx) {
                // Inside crop box - move
                setCropInteraction({ type: 'move', startX: coords.x, startY: coords.y, startCrop: crop });
            }
        } else {
            // Selection mode
            if (currentSelection) {
                // Check if clicking on existing selection to move/resize
                const { x, y, width, height } = currentSelection;
                const handleSize = 20;
                const hit = (hx: number, hy: number) => Math.abs(coords.x - hx) <= handleSize && Math.abs(coords.y - hy) <= handleSize;

                // Check corner handles
                if (hit(x, y)) {
                    setSelectionInteraction({ type: 'resize-tl', startX: coords.x, startY: coords.y, startSelection: currentSelection });
                } else if (hit(x + width, y)) {
                    setSelectionInteraction({ type: 'resize-tr', startX: coords.x, startY: coords.y, startSelection: currentSelection });
                } else if (hit(x, y + height)) {
                    setSelectionInteraction({ type: 'resize-bl', startX: coords.x, startY: coords.y, startSelection: currentSelection });
                } else if (hit(x + width, y + height)) {
                    setSelectionInteraction({ type: 'resize-br', startX: coords.x, startY: coords.y, startSelection: currentSelection });
                } else if (coords.x >= x && coords.x <= x + width && coords.y >= y && coords.y <= y + height) {
                    // Inside selection - move
                    setSelectionInteraction({ type: 'move', startX: coords.x, startY: coords.y, startSelection: currentSelection });
                } else {
                    // Outside selection - start new
                    setIsDrawing(true);
                    setDrawStart(coords);
                    setCurrentSelection(null);
                }
            } else {
                // No selection - start drawing new
                setIsDrawing(true);
                setDrawStart(coords);
                setCurrentSelection(null);
            }
        }
    };

    // Update selection or crop while dragging
    const handlePointerMove = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
        if (enableCrop) {
            // Crop mode: resize/move crop box
            if (cropInteraction.type === 'none' || !crop || !overlayRef.current) return;

            const coords = getCoords(e);
            const dx = coords.x - cropInteraction.startX;
            const dy = coords.y - cropInteraction.startY;

            const wCanvas = overlayRef.current.width;
            const hCanvas = overlayRef.current.height;

            // Convert px delta to % delta
            const dxPct = (dx / wCanvas) * 100;
            const dyPct = (dy / hCanvas) * 100;

            let newCrop = { ...cropInteraction.startCrop };

            const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

            switch (cropInteraction.type) {
                case 'move':
                    newCrop.x = clamp(newCrop.x + dxPct, 0, 100 - newCrop.width);
                    newCrop.y = clamp(newCrop.y + dyPct, 0, 100 - newCrop.height);
                    break;
                case 'resize-tl':
                    newCrop.x += dxPct;
                    newCrop.width -= dxPct;
                    newCrop.y += dyPct;
                    newCrop.height -= dyPct;
                    break;
                case 'resize-tr':
                    newCrop.y += dyPct;
                    newCrop.height -= dyPct;
                    newCrop.width += dxPct;
                    break;
                case 'resize-bl':
                    newCrop.x += dxPct;
                    newCrop.width -= dxPct;
                    newCrop.height += dyPct;
                    break;
                case 'resize-br':
                    newCrop.width += dxPct;
                    newCrop.height += dyPct;
                    break;
                case 'resize-t':
                    newCrop.y += dyPct;
                    newCrop.height -= dyPct;
                    break;
                case 'resize-b':
                    newCrop.height += dyPct;
                    break;
                case 'resize-l':
                    newCrop.x += dxPct;
                    newCrop.width -= dxPct;
                    break;
                case 'resize-r':
                    newCrop.width += dxPct;
                    break;
            }

            // Bounds checking
            if (newCrop.width < 5) newCrop.width = 5;
            if (newCrop.height < 5) newCrop.height = 5;
            if (newCrop.x < 0) newCrop.x = 0;
            if (newCrop.y < 0) newCrop.y = 0;
            if (newCrop.x + newCrop.width > 100) newCrop.width = 100 - newCrop.x;
            if (newCrop.y + newCrop.height > 100) newCrop.height = 100 - newCrop.y;

            setCrop(newCrop);
        } else {
            // Selection mode
            if (selectionInteraction.type !== 'none' && overlayRef.current) {
                // Moving or resizing existing selection
                const coords = getCoords(e);
                const dx = coords.x - selectionInteraction.startX;
                const dy = coords.y - selectionInteraction.startY;

                const wCanvas = overlayRef.current.width;
                const hCanvas = overlayRef.current.height;

                let newSelection = { ...selectionInteraction.startSelection };

                const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

                switch (selectionInteraction.type) {
                    case 'move':
                        newSelection.x = clamp(newSelection.x + dx, 0, wCanvas - newSelection.width);
                        newSelection.y = clamp(newSelection.y + dy, 0, hCanvas - newSelection.height);
                        break;
                    case 'resize-tl':
                        newSelection.x += dx;
                        newSelection.width -= dx;
                        newSelection.y += dy;
                        newSelection.height -= dy;
                        break;
                    case 'resize-tr':
                        newSelection.y += dy;
                        newSelection.height -= dy;
                        newSelection.width += dx;
                        break;
                    case 'resize-bl':
                        newSelection.x += dx;
                        newSelection.width -= dx;
                        newSelection.height += dy;
                        break;
                    case 'resize-br':
                        newSelection.width += dx;
                        newSelection.height += dy;
                        break;
                }

                // Bounds checking
                if (newSelection.width < 10) newSelection.width = 10;
                if (newSelection.height < 10) newSelection.height = 10;
                if (newSelection.x < 0) newSelection.x = 0;
                if (newSelection.y < 0) newSelection.y = 0;
                if (newSelection.x + newSelection.width > wCanvas) newSelection.width = wCanvas - newSelection.x;
                if (newSelection.y + newSelection.height > hCanvas) newSelection.height = hCanvas - newSelection.y;

                setCurrentSelection(newSelection);
            } else if (isDrawing && drawStart) {
                // Drawing new selection
                const coords = getCoords(e);
                const width = coords.x - drawStart.x;
                const height = coords.y - drawStart.y;

                setCurrentSelection({
                    x: width < 0 ? coords.x : drawStart.x,
                    y: height < 0 ? coords.y : drawStart.y,
                    width: Math.abs(width),
                    height: Math.abs(height),
                    tool: selectionTool
                });
            }
        }
    };

    // Finish drawing selection or crop interaction
    const handlePointerUp = () => {
        if (enableCrop) {
            setCropInteraction({ type: 'none', startX: 0, startY: 0, startCrop: { x: 0, y: 0, width: 0, height: 0 } });
        } else {
            setIsDrawing(false);
            setDrawStart(null);
            setSelectionInteraction({ type: 'none', startX: 0, startY: 0, startSelection: { x: 0, y: 0, width: 0, height: 0, tool: 'rectangle' } });
        }
    };

    // Apply edit action to selected area
    const applyEditAction = () => {
        if (!currentSelection || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Save current state for undo
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setEditHistory(prev => [...prev, currentState]);

        const { x, y, width, height, tool } = currentSelection;

        // Get pixel data
        const imageData = ctx.getImageData(x, y, width, height);
        const data = imageData.data;

        if (tool === 'rectangle') {
            // Apply action to rectangle
            applyPixelAction(data, editAction);
            ctx.putImageData(imageData, x, y);
        } else {
            // Apply action to circle using mask
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                // Create circular mask
                tempCtx.beginPath();
                tempCtx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
                tempCtx.clip();

                // Draw original data
                tempCtx.putImageData(imageData, 0, 0);

                // Get clipped data and apply action
                const clippedData = tempCtx.getImageData(0, 0, width, height);
                applyPixelAction(clippedData.data, editAction);

                // Put back
                ctx.putImageData(clippedData, x, y);
            }
        }

        // Clear selection after applying
        setCurrentSelection(null);
    };

    // Apply pixel-level transformations
    const applyPixelAction = (data: Uint8ClampedArray, action: 'invert' | 'paintBlack') => {
        for (let i = 0; i < data.length; i += 4) {
            if (action === 'invert') {
                data[i] = 255 - data[i];       // R
                data[i + 1] = 255 - data[i + 1]; // G
                data[i + 2] = 255 - data[i + 2]; // B
            } else if (action === 'paintBlack') {
                data[i] = 0;      // R
                data[i + 1] = 0;  // G
                data[i + 2] = 0;  // B
            }
        }
    };

    // Undo last edit
    const handleUndo = () => {
        if (editHistory.length <= 1 || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Remove current state and restore previous
        const newHistory = [...editHistory];
        newHistory.pop(); // Remove current
        const previousState = newHistory[newHistory.length - 1];

        ctx.putImageData(previousState, 0, 0);
        setEditHistory(newHistory);
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
                                onMouseDown={handlePointerDown}
                                onMouseMove={handlePointerMove}
                                onMouseUp={handlePointerUp}
                                onMouseLeave={handlePointerUp}
                                onTouchStart={handlePointerDown}
                                onTouchMove={handlePointerMove}
                                onTouchEnd={handlePointerUp}
                            />
                        </div>
                    </div>

                    {/* Controls - 35% on desktop */}
                    <div className="w-full lg:w-[35%] border-t lg:border-l lg:border-t-0 border-white/10 bg-slate-900 overflow-y-auto p-4 sm:p-6 lg:pt-8 space-y-4 sm:space-y-6 max-h-[40vh] lg:max-h-none">

                        {/* Selection Tool */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Selection Tool</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition border border-white/5">
                                    <input
                                        type="radio"
                                        name="selectionTool"
                                        value="rectangle"
                                        checked={selectionTool === 'rectangle'}
                                        onChange={() => setSelectionTool('rectangle')}
                                        className="w-4 h-4 text-purple-500 cursor-pointer"
                                    />
                                    <span className="text-white font-medium">Rectangle</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition border border-white/5">
                                    <input
                                        type="radio"
                                        name="selectionTool"
                                        value="circle"
                                        checked={selectionTool === 'circle'}
                                        onChange={() => setSelectionTool('circle')}
                                        className="w-4 h-4 text-purple-500 cursor-pointer"
                                    />
                                    <span className="text-white font-medium">Circle</span>
                                </label>
                            </div>
                        </div>

                        {/* Edit Action */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Edit Action</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition border border-white/5">
                                    <input
                                        type="radio"
                                        name="editAction"
                                        value="invert"
                                        checked={editAction === 'invert'}
                                        onChange={() => setEditAction('invert')}
                                        className="w-4 h-4 text-purple-500 cursor-pointer"
                                    />
                                    <span className="text-white font-medium">Invert Colors</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition border border-white/5">
                                    <input
                                        type="radio"
                                        name="editAction"
                                        value="paintBlack"
                                        checked={editAction === 'paintBlack'}
                                        onChange={() => setEditAction('paintBlack')}
                                        className="w-4 h-4 text-purple-500 cursor-pointer"
                                    />
                                    <span className="text-white font-medium">Paint Black</span>
                                </label>
                            </div>
                        </div>

                        {/* Apply & Undo Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={applyEditAction}
                                disabled={!currentSelection}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Apply
                            </button>
                            <button
                                onClick={handleUndo}
                                disabled={editHistory.length <= 1}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
                            >
                                <Undo2 className="w-4 h-4" />
                                Undo
                            </button>
                        </div>

                        {/* Enable Crop Checkbox */}
                        <div className="border-t border-white/5 pt-4">
                            <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition border border-white/5">
                                <input
                                    type="checkbox"
                                    checked={enableCrop}
                                    onChange={(e) => {
                                        setEnableCrop(e.target.checked);
                                        if (!e.target.checked) setCrop(null);
                                    }}
                                    className="w-4 h-4 text-purple-500 cursor-pointer rounded"
                                />
                                <span className="text-white font-semibold">Enable Crop</span>
                            </label>
                        </div>

                        {/* Crop Presets - Only show when enabled */}
                        {enableCrop && (
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
                        )}

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

