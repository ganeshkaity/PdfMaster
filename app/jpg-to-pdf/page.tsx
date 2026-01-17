"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { Image as ImageIcon, X, Loader2, Download, GripVertical, Settings2 } from "lucide-react";
import { PDFDocument, PageSizes } from "pdf-lib";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { usePWAFile } from "../hooks/usePWAFile";

interface ImageFile {
    id: string;
    file: File;
    preview: string;
}

export default function JpgToPdfPage() {
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageSize, setPageSize] = useState<"a4" | "fit">("a4");
    const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

    usePWAFile((file) => {
        handleFilesSelected([file]);
    });

    const handleFilesSelected = (newFiles: File[]) => {
        const newImageFiles = newFiles.map((file) => ({
            id: Math.random().toString(36).substring(7),
            file,
            preview: URL.createObjectURL(file), // Create preview URL
        }));
        setFiles((prev) => [...prev, ...newImageFiles]);
        toast.success(`${newFiles.length} images added`);
    };

    const removeFile = (id: string) => {
        setFiles((prev) => {
            const newFiles = prev.filter((f) => f.id !== id);
            // Clean up object URL to avoid memory leaks
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
            return newFiles;
        });
    };

    const handleConvert = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Converting images to PDF...");

        try {
            const pdfDoc = await PDFDocument.create();

            for (const imgFile of files) {
                const imageBytes = await imgFile.file.arrayBuffer();
                let image;

                try {
                    if (imgFile.file.type === "image/png") {
                        image = await pdfDoc.embedPng(imageBytes);
                    } else {
                        image = await pdfDoc.embedJpg(imageBytes);
                    }
                } catch (e) {
                    // Fallback if type detection fails or is weird, try try jpg then png
                    try {
                        image = await pdfDoc.embedJpg(imageBytes);
                    } catch {
                        image = await pdfDoc.embedPng(imageBytes);
                    }
                }

                if (!image) throw new Error("Could not embed image");

                let page;
                const imgDims = image.scale(1);

                if (pageSize === "a4") {
                    const [width, height] = PageSizes.A4;
                    const pageDims = orientation === "portrait" ? { width, height } : { width: height, height: width };

                    page = pdfDoc.addPage([pageDims.width, pageDims.height]);

                    // Calculate 'contain' fit
                    const scale = Math.min(
                        (pageDims.width - 40) / imgDims.width,
                        (pageDims.height - 40) / imgDims.height
                    );

                    const scaledWidth = imgDims.width * scale;
                    const scaledHeight = imgDims.height * scale;

                    page.drawImage(image, {
                        x: (pageDims.width - scaledWidth) / 2,
                        y: (pageDims.height - scaledHeight) / 2,
                        width: scaledWidth,
                        height: scaledHeight,
                    });
                } else {
                    // Fit to image size
                    page = pdfDoc.addPage([imgDims.width, imgDims.height]);
                    page.drawImage(image, {
                        x: 0,
                        y: 0,
                        width: imgDims.width,
                        height: imgDims.height,
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            saveAs(blob, `images-to-pdf-${Date.now()}.pdf`);

            toast.success("PDF created successfully!", { id: loadingToast });
        } catch (error) {
            console.error(error);
            toast.error("Failed to create PDF. Ensure images are valid JPG/PNG.", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="JPG to PDF"
            description="Convert your images to a single high-quality PDF document. Works with JPG and PNG."
            icon={<ImageIcon className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                <FileDropZone
                    onFilesSelected={handleFilesSelected}
                    accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }}
                    title="Drop image files here"
                    className="h-48"
                />

                {files.length > 0 && (
                    <div className="space-y-6">
                        {/* Options Panel */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex items-center space-x-2 text-white font-semibold mb-2">
                                <Settings2 className="w-5 h-5 text-cyan-400" />
                                <span>PDF Options</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Page Size</label>
                                    <div className="flex p-1 bg-slate-900 rounded-lg">
                                        <button
                                            onClick={() => setPageSize("a4")}
                                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${pageSize === "a4" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                                }`}
                                        >
                                            A4 Standard
                                        </button>
                                        <button
                                            onClick={() => setPageSize("fit")}
                                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${pageSize === "fit" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                                }`}
                                        >
                                            Fit Image
                                        </button>
                                    </div>
                                </div>

                                {pageSize === "a4" && (
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Orientation</label>
                                        <div className="flex p-1 bg-slate-900 rounded-lg">
                                            <button
                                                onClick={() => setOrientation("portrait")}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${orientation === "portrait" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                                    }`}
                                            >
                                                Portrait
                                            </button>
                                            <button
                                                onClick={() => setOrientation("landscape")}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${orientation === "landscape" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                                    }`}
                                            >
                                                Landscape
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-2">
                            <AnimatePresence>
                                {files.map((file) => (
                                    <Reorder.Item
                                        key={file.id}
                                        value={file}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <div className="group flex items-center p-3 bg-slate-800/50 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                                            <div className="cursor-grab active:cursor-grabbing p-2 text-slate-500 hover:text-slate-300">
                                                <GripVertical className="w-5 h-5" />
                                            </div>

                                            <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden mr-4 border border-white/10 relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                                            </div>

                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">
                                                    {file.file.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB • {file.file.type.split("/")[1].toUpperCase()}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConvert}
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Converting...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6" />
                                    <span>Convert to PDF</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
