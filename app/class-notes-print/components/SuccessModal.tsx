import React from 'react';
import { Check, CheckCircle2, FileText, Download, RotateCcw, Eye } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    fileName: string;
    originalSize: string;
    finalSize: string;
    pageCount: number;
    onDownload: () => void;
    onPreview: () => void;
    onProcessAnother: () => void;
}

export default function SuccessModal({
    isOpen,
    fileName,
    originalSize,
    finalSize,
    pageCount,
    onDownload,
    onPreview,
    onProcessAnother
}: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 pt-24">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">

                <div className="flex flex-col items-center text-center">

                    {/* Success Icon */}
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <Check className="w-8 h-8 text-white stroke-[3]" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs">
                        Your document has been enhanced and is ready for download.
                    </p>

                    {/* Warning Card */}
                    <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-6 flex items-center justify-center gap-2">
                        <span className="text-yellow-500">⚠️</span>
                        <span className="text-sm font-medium text-yellow-500">Always Review The Notes Content Before Printing</span>
                    </div>

                    {/* File Card */}
                    <div className="w-full bg-slate-800/50 rounded-2xl border border-white/5 p-4 mb-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left overflow-hidden">
                                <h4 className="text-white font-medium truncate w-full" title={fileName}>
                                    {fileName}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">Enhanced PDF</p>
                            </div>
                        </div>

                        <div className="h-px bg-white/10 w-full mb-4" />

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Original Size</p>
                                <p className="text-sm font-bold text-white">{originalSize}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Final Size</p>
                                <p className="text-sm font-bold text-white">{finalSize}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pages</p>
                                <p className="text-sm font-bold text-white">{pageCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full grid grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={onDownload}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                        <button
                            onClick={onPreview}
                            className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            <Eye className="w-4 h-4" /> Preview
                        </button>
                    </div>

                    <button
                        onClick={onProcessAnother}
                        className="w-full py-3 text-slate-400 font-medium hover:text-white transition-colors flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-xl"
                    >
                        Process Another
                    </button>

                </div>
            </div>
        </div>
    );
}
