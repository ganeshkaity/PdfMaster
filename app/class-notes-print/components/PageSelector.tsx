"use client";

import { useState, useEffect, useRef } from "react";
import { Check, CheckCircle2, Circle } from "lucide-react";
import { renderPageToCanvas } from "../../utils/class-notes-utils";
import { motion } from "framer-motion";

interface PageSelectorProps {
    pdf: any;
    selectedPages: number[];
    onSelectionChange: (pages: number[]) => void;
    onNext: () => void;
    onBack: () => void;
}

const PageThumbnail = ({ pdf, pageNum, isSelected, onClick }: { pdf: any, pageNum: number, isSelected: boolean, onClick: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let active = true;
        const render = async () => {
            if (!pdf || loaded) return;
            // Render small thumbnail
            const canvas = await renderPageToCanvas(pdf, pageNum, 0.3);
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
    }, [pdf, pageNum]);

    return (
        <div
            onClick={onClick}
            className={`relative group cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-200 ${isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/10 hover:border-white/30'}`}
        >
            <div className={`aspect-[1/1.41] bg-slate-900 flex items-center justify-center relative`}>
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                {!loaded && <span className="text-slate-500 text-xs">Loading...</span>}

                {/* Overlay for selection state */}
                <div className={`absolute inset-0 transition-opacity bg-cyan-500/10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>

            <div className="absolute top-2 right-2">
                {isSelected ? (
                    <div className="bg-cyan-500 text-white rounded-full p-1 shadow-lg">
                        <Check className="w-3 h-3" />
                    </div>
                ) : (
                    <div className="bg-slate-900/80 text-slate-400 rounded-full p-1 border border-white/10 group-hover:border-white/50">
                        <div className="w-3 h-3" />
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 w-full bg-slate-950/80 backdrop-blur-sm py-1 text-center border-t border-white/5">
                <span className={`text-xs font-mono ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>Page {pageNum}</span>
            </div>
        </div>
    );
};

export default function PageSelector({ pdf, selectedPages, onSelectionChange, onNext, onBack }: PageSelectorProps) {

    const togglePage = (pageNum: number) => {
        if (selectedPages.includes(pageNum)) {
            onSelectionChange(selectedPages.filter(p => p !== pageNum));
        } else {
            onSelectionChange([...selectedPages, pageNum].sort((a, b) => a - b));
        }
    };

    const selectAll = () => {
        if (!pdf) return;
        const all = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
        onSelectionChange(all);
    };

    const deselectAll = () => {
        onSelectionChange([]);
    };

    return (
        <div className="space-y-6">

            {/* Header Controls */}
            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-white/5 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-white">Select Pages</h3>
                    <div className="h-6 w-px bg-white/10" />
                    <span className="text-slate-400 text-sm">{selectedPages.length} of {pdf?.numPages} selected</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {pdf && Array.from({ length: pdf.numPages }, (_, i) => i + 1).map((pageNum) => (
                    <PageThumbnail
                        key={pageNum}
                        pdf={pdf}
                        pageNum={pageNum}
                        isSelected={selectedPages.includes(pageNum)}
                        onClick={() => togglePage(pageNum)}
                    />
                ))}
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
