"use client";

import { useState, useEffect, useRef } from "react";
import { Check, CheckCircle2, Circle, Pencil, RotateCw, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { renderPageToCanvas } from "../../utils/class-notes-utils";
import { motion } from "framer-motion";

import { CropRegion } from "./PageEditModal";

interface PageSelectorProps {
    files: Array<{ file: File; pdfRef: any; pageCount: number }>;
    totalPages: number;
    pageToFileMap: Record<number, number>;
    selectedPages: number[];
    onSelectionChange: (pages: number[]) => void;
    onPageOrderChange: (order: number[]) => void;
    onNext: () => void;
    onBack: () => void;
    onEdit: (pageNum: number) => void;
    pageRotations: Record<number, number>;
    pageCrops: Record<number, CropRegion>;
    pageEdits: Record<number, string>;
    onAddMore?: (files: File[]) => void;
}

const PageThumbnail = ({
    pdfRef,
    pageNum,
    globalPageNum,
    isSelected,
    rotation,
    isEdited,
    onClick,
    onEdit,
    isDragging,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown
}: {
    pdfRef: any,
    pageNum: number,
    globalPageNum: number,
    isSelected: boolean,
    rotation?: number,
    isEdited?: boolean,
    onClick: () => void,
    onEdit: (p: number) => void,
    isDragging: boolean,
    onDragStart: (e: React.DragEvent) => void,
    onDragEnd: () => void,
    onDragOver: (e: React.DragEvent) => void,
    onDrop: (e: React.DragEvent) => void,
    onMoveUp: () => void,
    onMoveDown: () => void,
    canMoveUp: boolean,
    canMoveDown: boolean
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            {
                root: null, // viewport
                rootMargin: '200px', // Start loading 200px before entering viewport
                threshold: 0.01 // Trigger as soon as 1% is visible
            }
        );

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Render canvas when visible
    useEffect(() => {
        if (!isVisible || !pdfRef || loaded || hasError) return;

        let active = true;
        const render = async () => {
            try {
                // Render small thumbnail with reduced scale for memory efficiency
                const canvas = await renderPageToCanvas(pdfRef, pageNum, 0.3, rotation || 0);
                if (active && canvas && canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        canvasRef.current.width = canvas.width;
                        canvasRef.current.height = canvas.height;
                        ctx.drawImage(canvas, 0, 0);
                        setLoaded(true);
                    }
                }
            } catch (error) {
                console.error(`Failed to render page ${globalPageNum}:`, error);
                if (active) {
                    setHasError(true);
                }
            }
        };

        render();
        return () => { active = false; };
    }, [isVisible, pdfRef, pageNum, rotation, loaded, hasError, globalPageNum]);

    return (
        <div
            ref={containerRef}
            onClick={onClick}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative group bg-slate-800 rounded-xl overflow-hidden cursor-move border-2 transition-all ${isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-transparent hover:border-white/20'
                } ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'
                }`}
            style={{ aspectRatio: '1 / 1.414' }}
        >
            <div className={`aspect-[1/1.41] bg-slate-900 flex items-center justify-center relative`}>
                {/* Canvas - hidden until loaded */}
                <canvas 
                    ref={canvasRef} 
                    className={`w-full h-full object-contain transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`} 
                />
                
                {/* Loading State */}
                {!loaded && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isVisible ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-slate-500 text-xs">Loading...</span>
                            </div>
                        ) : (
                            <div className="w-12 h-16 bg-slate-700/50 rounded animate-pulse"></div>
                        )}
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1 text-center px-2">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-400 text-xs">Failed to load</span>
                        </div>
                    </div>
                )}

                {/* Overlay for selection state */}
                <div className={`absolute inset-0 transition-opacity bg-cyan-500/10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>

            {/* Drag Indicator - Hidden on small screens */}
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                <div className="bg-slate-950/80 rounded p-1 text-slate-400">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z"></path>
                    </svg>
                </div>
            </div>

            {/* Action Buttons Column - Responsive */}
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex flex-col gap-1 sm:gap-2">
                {/* Selection Indicator */}
                {isSelected ? (
                    <div
                        className="bg-cyan-500 text-white rounded-full p-1 sm:p-2 shadow-lg cursor-pointer hover:bg-cyan-600 transition"
                    >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                ) : (
                    <div
                        className="bg-slate-900/80 text-slate-400 rounded-full p-1 sm:p-2 border border-white/10 group-hover:border-white/50 cursor-pointer hover:bg-slate-800 transition"
                    >
                        <div className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                )}

                {/* Edit Button - Always visible */}
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(globalPageNum); }}
                    className="bg-slate-950/80 p-1 sm:p-2 rounded-lg transition-all hover:bg-purple-500 hover:scale-110"
                    title="Edit Page"
                >
                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 hover:text-white" />
                </button>
            </div>

            {/* Mobile Reorder Buttons - Left side, visible only on mobile */}
            <div className="absolute top-1 left-1 flex flex-col gap-1 lg:hidden">
                <button
                    onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                    disabled={!canMoveUp}
                    className={`p-1 rounded-lg transition-all ${canMoveUp
                        ? 'bg-cyan-500/90 hover:bg-cyan-600 text-white'
                        : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                        }`}
                    title="Move Up"
                >
                    <ArrowUp className="w-3 h-3" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                    disabled={!canMoveDown}
                    className={`p-1 rounded-lg transition-all ${canMoveDown
                        ? 'bg-cyan-500/90 hover:bg-cyan-600 text-white'
                        : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                        }`}
                    title="Move Down"
                >
                    <ArrowDown className="w-3 h-3" />
                </button>
            </div>

            <div className="absolute bottom-0 w-full bg-slate-950/80 backdrop-blur-sm py-1 text-center border-t border-white/5 flex flex-col items-center justify-center">
                {isEdited && (
                    <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider leading-none mb-0.5">
                        Edited
                    </span>
                )}
                <span className={`text-xs font-mono leading-none ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>Page {globalPageNum}</span>
            </div>
        </div>
    );
};

export default function PageSelector({ files, totalPages, pageToFileMap, selectedPages, onSelectionChange, onPageOrderChange, onNext, onBack, onEdit, pageRotations, pageCrops, pageEdits, onAddMore }: PageSelectorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [draggedPage, setDraggedPage] = useState<number | null>(null);
    const [pageOrder, setPageOrder] = useState<number[]>([]);

    // Initialize page order
    useEffect(() => {
        setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1));
    }, [totalPages]);

    // Notify parent when page order changes
    useEffect(() => {
        if (pageOrder.length > 0) {
            onPageOrderChange(pageOrder);
        }
    }, [pageOrder, onPageOrderChange]);

    const togglePage = (pageNum: number) => {
        if (selectedPages.includes(pageNum)) {
            onSelectionChange(selectedPages.filter(p => p !== pageNum));
        } else {
            onSelectionChange([...selectedPages, pageNum].sort((a, b) => a - b));
        }
    };

    const selectAll = () => {
        const all = Array.from({ length: totalPages }, (_, i) => i + 1);
        onSelectionChange(all);
    };

    const deselectAll = () => {
        onSelectionChange([]);
    };

    const movePageUp = (globalPageNum: number) => {
        const currentIndex = pageOrder.indexOf(globalPageNum);
        if (currentIndex > 0) {
            const newOrder = [...pageOrder];
            [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
            setPageOrder(newOrder);
        }
    };

    const movePageDown = (globalPageNum: number) => {
        const currentIndex = pageOrder.indexOf(globalPageNum);
        if (currentIndex < pageOrder.length - 1) {
            const newOrder = [...pageOrder];
            [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
            setPageOrder(newOrder);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-slate-800/50 p-4 rounded-2xl border border-white/5 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <h3 className="text-base sm:text-lg font-bold text-white">Select Pages</h3>
                    <div className="h-6 w-px bg-white/10" />
                    <span className="text-slate-400 text-xs sm:text-sm">{selectedPages.length} of {totalPages} selected</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {onAddMore && (
                        <>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition flex items-center justify-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add More Files
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0 && onAddMore) {
                                        onAddMore(files);
                                    }
                                    e.target.value = ''; // Reset input
                                }}
                            />
                            <div className="hidden sm:block h-6 w-px bg-white/10" />
                        </>
                    )}
                    <button
                        onClick={selectAll}
                        className="px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 transition"
                    >
                        Select All
                    </button>
                    <button
                        onClick={deselectAll}
                        className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-700/50 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition"
                    >
                        Deselect All
                    </button>
                </div>
            </div>

            {/* Pages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {pageOrder.map((globalPageNum) => {
                    const fileIndex = pageToFileMap[globalPageNum];
                    if (fileIndex === undefined) return null;

                    const fileData = files[fileIndex];

                    // Calculate local page number within the file
                    let localPageNum = globalPageNum;
                    for (let j = 0; j < fileIndex; j++) {
                        localPageNum -= files[j].pageCount;
                    }

                    const currentIndex = pageOrder.indexOf(globalPageNum);

                    return (
                        <PageThumbnail
                            key={globalPageNum}
                            pdfRef={fileData.pdfRef}
                            pageNum={localPageNum}
                            globalPageNum={globalPageNum}
                            isSelected={selectedPages.includes(globalPageNum)}
                            rotation={pageRotations?.[globalPageNum]}
                            isEdited={
                                (pageRotations?.[globalPageNum] !== undefined && pageRotations[globalPageNum] !== 0) ||
                                !!pageCrops?.[globalPageNum] ||
                                !!pageEdits?.[globalPageNum]
                            }
                            onClick={() => togglePage(globalPageNum)}
                            onEdit={onEdit}
                            isDragging={draggedPage === globalPageNum}
                            onDragStart={(e) => {
                                setDraggedPage(globalPageNum);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', globalPageNum.toString());
                            }}
                            onDragEnd={() => setDraggedPage(null)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (draggedPage === null || draggedPage === globalPageNum) return;

                                // Reorder pages
                                const newOrder = [...pageOrder];
                                const draggedIndex = newOrder.indexOf(draggedPage);
                                const targetIndex = newOrder.indexOf(globalPageNum);

                                newOrder.splice(draggedIndex, 1);
                                newOrder.splice(targetIndex, 0, draggedPage);

                                setPageOrder(newOrder);
                                setDraggedPage(null);
                            }}
                            onMoveUp={() => movePageUp(globalPageNum)}
                            onMoveDown={() => movePageDown(globalPageNum)}
                            canMoveUp={currentIndex > 0}
                            canMoveDown={currentIndex < pageOrder.length - 1}
                        />
                    );
                })}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                    onClick={onBack}
                    className="px-6 py-3 text-slate-400 hover:text-white transition"
                >
                    Back to Upload
                </button>
                <button
                    onClick={onNext}
                    disabled={selectedPages.length === 0}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next Step
                </button>
            </div>
        </div>
    );
}
