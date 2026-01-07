"use client";

import { useState, useRef } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { Image as ImageIcon, File as FileIcon, Loader2, Download, Layers } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import * as pdfjsLib from "pdfjs-dist";

// Configure worker. Note: In Next.js app router, it's often best to use a CDN or local public file.
// We use unpkg CDN for simplicity and reliability in this setup.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;


export default function PdfToJpgPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageCount, setPageCount] = useState<number>(0);
    const [progress, setProgress] = useState(0);

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            try {
                const buffer = await files[0].arrayBuffer();
                const pdf = await pdfjsLib.getDocument(buffer).promise;
                setPageCount(pdf.numPages);
            } catch (e) {
                toast.error("Failed to load PDF");
            }
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setProgress(0);
        const loadingToast = toast.loading("Initializing conversion...");

        try {
            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(buffer).promise;
            const zip = new JSZip();

            for (let i = 1; i <= pdf.numPages; i++) {
                toast.loading(`Converting page ${i} of ${pdf.numPages}...`, { id: loadingToast });

                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 }); // Scale 2 for better quality (retina-like)

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;

                    const blob = await new Promise<Blob | null>((resolve) =>
                        canvas.toBlob(resolve, "image/jpeg", 0.9) // 90% quality JPG
                    );

                    if (blob) {
                        zip.file(`${file.name.replace(".pdf", "")}_page_${i}.jpg`, blob);
                    }
                }

                setProgress(Math.round((i / pdf.numPages) * 100));
            }

            toast.loading("Zipping images...", { id: loadingToast });
            const zipContent = await zip.generateAsync({ type: "blob" });
            saveAs(zipContent, `${file.name.replace(".pdf", "")}_images.zip`);

            toast.success("Conversion successful! Download started.", { id: loadingToast });

        } catch (error) {
            console.error(error);
            toast.error("Failed to convert PDF to JPG", { id: loadingToast });
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return (
        <ToolLayout
            title="PDF to JPG"
            description="Turn your PDF pages into high-quality JPG images. Download all pages at once."
            icon={<ImageIcon className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                {!file ? (
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        title="Drop PDF to convert"
                        className="h-64"
                    />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-red-500/10 rounded-lg">
                                    <FileIcon className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">{file.name}</h3>
                                    <p className="text-sm text-slate-400">{pageCount} pages • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); setPageCount(0); }}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                Change File
                            </button>
                        </div>

                        {isProcessing && (
                            <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
                                <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}

                        <button
                            onClick={handleConvert}
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Converting {progress}%...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6" />
                                    <span>Convert to JPG Images</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
