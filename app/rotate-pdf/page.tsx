"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { RefreshCcw, File as FileIcon, Loader2, Download, RotateCw } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { usePWAFile } from "../hooks/usePWAFile";

export default function RotatePdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [rotation, setRotation] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    usePWAFile((file) => {
        handleFileSelected([file]);
    });

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) setFile(files[0]);
    };

    const handleRotate = async () => {
        if (!file) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Rotating PDF...");

        try {
            const buffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(buffer);

            const pages = pdf.getPages();
            pages.forEach((page) => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + rotation));
            });

            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            saveAs(blob, `${file.name.replace(".pdf", "")}_rotated.pdf`);
            toast.success("PDF Rotated!", { id: loadingToast });

        } catch (error) {
            console.error(error);
            toast.error("Failed to rotate PDF", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Rotate PDF"
            description="Rotate your PDF pages permanently. Correct wrong orientations."
            icon={<RefreshCcw className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                {!file ? (
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        title="Drop PDF to rotate"
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
                                    <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); setRotation(0); }}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                Change File
                            </button>
                        </div>

                        <div className="flex justify-center space-x-4">
                            {[90, 180, 270].map((deg) => (
                                <button
                                    key={deg}
                                    onClick={() => setRotation(deg)}
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all w-32 h-32 ${rotation === deg
                                        ? "border-cyan-500 bg-cyan-500/10 text-white"
                                        : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:text-white"
                                        }`}
                                >
                                    <RotateCw className={`w-8 h-8 mb-2 ${rotation === deg ? "animate-spin-slow" : ""}`} style={{ transform: `rotate(${deg}deg)` }} />
                                    <span className="font-bold">+{deg}°</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleRotate}
                            disabled={isProcessing || rotation === 0}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6" />
                                    <span>Apply Rotation & Download</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
