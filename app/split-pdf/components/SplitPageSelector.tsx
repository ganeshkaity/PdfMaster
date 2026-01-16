"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { renderPageToCanvas } from "../../utils/class-notes-utils";

interface SplitPageSelectorProps {
    files: Array<{ file: File; pdfRef: any; pageCount: number }>;
    pageToFileMap: Record<number, number>; // globalPageNum -> fileIndex
    totalPages: number;
    selectedPages: number[];
    onSelectionChange: (pages: number[]) => void;
}

const PageThumbnail = ({
    pdfRef,
    pageNum,       // local page number (1-based)
    globalPageNum, // global page number
    isSelected,
    onClick
}: {
    pdfRef: any,
    pageNum: number,
    globalPageNum: number,
    isSelected: boolean,
    onClick: () => void
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let active = true;
        const render = async () => {
            if (!pdfRef || loaded) return;
            // Render small thumbnail
            const canvas = await renderPageToCanvas(pdfRef, pageNum, 0.5, 0); // No rotation support for split
            if (active && canvas && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    canvasRef.current.width = canvas.width;
                    canvasRef.current.height = canvas.height;
                    ctx.drawImage(canvas, 0, 0);
                    setLoaded(true);
                }
            }
        };
        render();
        return () => { active = false; };
    }, [pdfRef, pageNum]);

    return (
        <div
            onClick={onClick}
            className={`relative group bg-slate-800 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-transparent hover:border-white/20'
                } hover:scale-[1.02]`}
            style={{ aspectRatio: '1 / 1.414' }}
        >
            <div className="aspect-[1/1.41] bg-slate-900 flex items-center justify-center relative">
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                {!loaded && <span className="text-slate-500 text-xs">Loading...</span>}

                {/* Overlay for selection state */}
                <div className={`absolute inset-0 transition-opacity bg-cyan-500/10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>

            {/* Selection Checkbox */}
            <div className="absolute top-2 right-2">
                {isSelected ? (
                    <div className="bg-cyan-500 text-white rounded-full p-1 shadow-lg">
                        <Check className="w-4 h-4" />
                    </div>
                ) : (
                    <div className="bg-slate-900/80 text-slate-400 rounded-full p-1 border border-white/10 group-hover:border-white/50">
                        <div className="w-4 h-4" />
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 w-full bg-slate-950/80 backdrop-blur-sm py-1 text-center border-t border-white/5">
                <span className={`text-xs font-mono leading-none ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>
                    Page {globalPageNum}
                </span>
            </div>
        </div>
    );
};

export default function SplitPageSelector({
    files,
    pageToFileMap,
    totalPages,
    selectedPages,
    onSelectionChange
}: SplitPageSelectorProps) {

    // Simple 1..N order
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const togglePage = (pageNum: number) => {
        if (selectedPages.includes(pageNum)) {
            onSelectionChange(selectedPages.filter(p => p !== pageNum));
        } else {
            onSelectionChange([...selectedPages, pageNum].sort((a, b) => a - b));
        }
    };

    const selectAll = () => onSelectionChange(pages);
    const deselectAll = () => onSelectionChange([]);

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/50 p-4 rounded-2xl border border-white/5 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-white">Select Pages</h3>
                    <div className="h-6 w-px bg-white/10" />
                    <span className="text-slate-400 text-sm">{selectedPages.length} of {totalPages} selected</span>
                </div>

                <div className="flex items-center gap-2">
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

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {pages.map((globalPageNum) => {
                    const fileIndex = pageToFileMap[globalPageNum];
                    if (fileIndex === undefined) return null;
                    const fileData = files[fileIndex];

                    // Calculate local page number
                    let localPageNum = globalPageNum;
                    for (let j = 0; j < fileIndex; j++) {
                        localPageNum -= files[j].pageCount;
                    }

                    return (
                        <PageThumbnail
                            key={globalPageNum}
                            pdfRef={fileData.pdfRef}
                            pageNum={localPageNum}
                            globalPageNum={globalPageNum}
                            isSelected={selectedPages.includes(globalPageNum)}
                            onClick={() => togglePage(globalPageNum)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
