import React from 'react';
import { Check, FileText, Download, Eye, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti'; // Optional: if you have it installed, or we can skip/shim it. I'll skip for now to avoid dep check.

interface SuccessViewProps {
    fileName: string;
    originalSize: string;
    finalSize: string;
    pageCount: number;
    onDownload: () => void;
    onPreview: () => void;
    onProcessAnother: () => void;
}

export default function SuccessView({
    fileName,
    originalSize,
    finalSize,
    pageCount,
    onDownload,
    onPreview,
    onProcessAnother
}: SuccessViewProps) {

    // Trigger confetti on mount
    React.useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#10b981', '#3b82f6', '#8b5cf6']
        });
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto mt-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative text-center overflow-hidden">

                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col items-center">

                    {/* Success Icon */}
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(34,197,94,0.4)] ring-4 ring-slate-900">
                        <Check className="w-12 h-12 text-white stroke-[3]" />
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Success!</h2>
                    <p className="text-slate-400 text-lg mb-10 max-w-md">
                        Your document has been optimized and is ready for download.
                    </p>

                    {/* File Card */}
                    <div className="w-full bg-slate-950/50 rounded-2xl border border-white/5 p-6 mb-8 group hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div className="text-left overflow-hidden">
                                <h4 className="text-white font-bold text-lg truncate w-full mb-1" title={fileName}>
                                    {fileName}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 uppercase tracking-wide">Ready</span>
                                    <span className="text-xs text-slate-500">Enhanced PDF</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5 w-full mb-6" />

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Original</p>
                                <p className="text-base font-bold text-slate-300">{originalSize}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/50 border border-green-500/20 relative overflow-hidden">
                                <div className="absolute inset-0 bg-green-500/5" />
                                <p className="text-[10px] text-green-500 uppercase tracking-wider mb-1">Optimized</p>
                                <p className="text-base font-bold text-white">{finalSize}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pages</p>
                                <p className="text-base font-bold text-slate-300">{pageCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={onPreview}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] border border-white/5"
                        >
                            <Eye className="w-5 h-5" /> Preview PDF
                        </button>
                        <button
                            onClick={onDownload}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98]"
                        >
                            <Download className="w-5 h-5" /> Download PDF
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
