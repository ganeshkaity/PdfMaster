"use client";
import React, { useState } from 'react';
import { Check, Archive, Download, ArrowLeft, Edit2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SplitSuccessViewProps {
    fileName: string;
    originalSize: string;
    finalSize: string;
    pageCount: number;
    onDownload: (customFileName?: string) => void;
    onProcessAnother: () => void;
}

export default function SplitSuccessView({
    fileName,
    originalSize,
    finalSize,
    pageCount,
    onDownload,
    onProcessAnother
}: SplitSuccessViewProps) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [editedName, setEditedName] = useState(fileName);

    React.useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#3b82f6', '#8b5cf6'] // Cyan theme
        });
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto mt-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-[0_10px_40px_rgba(34,211,238,0.4)] ring-4 ring-slate-900">
                        <Check className="w-12 h-12 text-white stroke-[3]" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Success!</h2>
                    <p className="text-slate-400 text-base mb-6 max-w-md">
                        Your files are ready.
                    </p>

                    <div className="w-full bg-slate-950/50 rounded-2xl border border-white/5 p-4 mb-6 group hover:border-white/10 transition-colors">
                        <div className="flex flex-col items-center gap-3 mb-4">
                            <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                                <Archive className="w-7 h-7" />
                            </div>

                            <div className="w-full overflow-hidden relative">
                                {isRenaming ? (
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        onBlur={() => setIsRenaming(false)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') setIsRenaming(false);
                                            if (e.key === 'Escape') {
                                                setEditedName(fileName);
                                                setIsRenaming(false);
                                            }
                                        }}
                                        autoFocus
                                        className="w-full bg-slate-900 border border-cyan-500 rounded-lg px-3 py-2 text-white text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                ) : (
                                    <h4 className="text-white font-bold text-lg text-center truncate px-4" title={editedName}>
                                        {editedName}
                                    </h4>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center border-t border-white/5 pt-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Files</p>
                                <p className="text-base font-bold text-slate-300">{pageCount}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-cyan-500 uppercase tracking-wider mb-1">Size</p>
                                <p className="text-base font-bold text-white">{finalSize}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={() => setIsRenaming(!isRenaming)}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] border border-white/5"
                        >
                            <Edit2 className="w-4 h-4" /> Rename ZIP
                        </button>
                        <button
                            onClick={() => onDownload(editedName)}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-3 rounded-xl transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.98]"
                        >
                            <Download className="w-5 h-5" /> Download ZIP
                        </button>
                    </div>

                    <button
                        onClick={onProcessAnother}
                        className="text-slate-500 font-medium hover:text-white transition-colors flex items-center gap-2 text-sm pt-4 border-t border-white/5 w-full justify-center hover:border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" /> Process Another Document
                    </button>
                </div>
            </div>
        </div>
    );
}
