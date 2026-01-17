"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { Crop, File as FileIcon, Loader2, Download } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { usePWAFile } from "../hooks/usePWAFile";

export default function CropPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    usePWAFile((file) => {
        handleFileSelected([file]);
    });

    // Crop margins in points (1/72 inch)
    const [top, setTop] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [left, setLeft] = useState(0);
    const [right, setRight] = useState(0);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) setFile(files[0]);
    };

    const handleCrop = async () => {
        if (!file) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Cropping PDF...");

        try {
            const buffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(buffer);
            const pages = pdf.getPages();

            pages.forEach((page) => {
                const { width, height } = page.getSize();

                // Calculate new crop box
                // pdf-lib setCropBox(x, y, width, height)
                // x, y are bottom-left

                const newX = left;
                const newY = bottom;
                const newWidth = width - left - right;
                const newHeight = height - top - bottom;

                if (newWidth > 0 && newHeight > 0) {
                    page.setCropBox(newX, newY, newWidth, newHeight);
                    page.setMediaBox(newX, newY, newWidth, newHeight); // Update visible area
                }
            });

            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            saveAs(blob, `${file.name.replace(".pdf", "")}_cropped.pdf`);
            toast.success("PDF Cropped!", { id: loadingToast });

        } catch (error) {
            console.error(error);
            toast.error("Failed to crop PDF", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Crop PDF"
            description="Trim margins from your PDF pages."
            icon={<Crop className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                {!file ? (
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        title="Drop PDF to crop"
                        className="h-64"
                    />
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-red-500/10 rounded-lg">
                                    <FileIcon className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">{file.name}</h3>
                                    <p className="text-sm text-slate-400">Set margins to remove</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); }}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                Change File
                            </button>
                        </div>

                        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
                            <div className="col-span-2 text-center text-sm text-slate-400 mb-2">Crop Values (Points)</div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Top Margin</label>
                                <input type="number" value={top} onChange={(e) => setTop(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Bottom Margin</label>
                                <input type="number" value={bottom} onChange={(e) => setBottom(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Left Margin</label>
                                <input type="number" value={left} onChange={(e) => setLeft(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Right Margin</label>
                                <input type="number" value={right} onChange={(e) => setRight(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
                            </div>
                        </div>

                        <button
                            onClick={handleCrop}
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Cropping...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6" />
                                    <span>Crop & Download</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
