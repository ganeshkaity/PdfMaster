"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { Combine, File as FileIcon, X, ArrowDown, ArrowUp, Download, Loader2, GripVertical } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { Reorder, useDragControls, motion, AnimatePresence } from "framer-motion";
import { usePWAFile } from "../hooks/usePWAFile";

interface PdfFile {
    id: string;
    file: File;
    pageCount?: number;
}

export default function MergePdfPage() {
    const [files, setFiles] = useState<PdfFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    usePWAFile((file) => {
        handleFilesSelected([file]);
    });

    const handleFilesSelected = async (newFiles: File[]) => {
        const newPdfFiles = newFiles.map((file) => ({
            id: Math.random().toString(36).substring(7),
            file,
        }));
        setFiles((prev) => [...prev, ...newPdfFiles]);
        toast.success(`${newFiles.length} file(s) added`);
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error("Please select at least 2 PDF files to merge.");
            return;
        }

        setIsProcessing(true);
        const loadingToast = toast.loading("Merging PDFs...");

        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of files) {
                const fileBuffer = await pdfFile.file.arrayBuffer();
                const pdf = await PDFDocument.load(fileBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes as any], { type: "application/pdf" });
            saveAs(blob, `merged-document-${Date.now()}.pdf`);

            toast.success("PDFs merged successfully!", { id: loadingToast });
            setFiles([]); // Optional: clear files after successful merge
        } catch (error) {
            console.error(error);
            toast.error("Failed to merge PDFs. Please try again.", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Merge PDF"
            description="Combine multiple PDF files into one. Drag and drop to reorder the files."
            icon={<Combine className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                <FileDropZone
                    onFilesSelected={handleFilesSelected}
                    accept={{ "application/pdf": [".pdf"] }}
                    title="Drop PDFs here to merge"
                    className="h-48"
                />

                {files.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-slate-400 text-sm px-2">
                            <span>{files.length} files selected</span>
                            <button
                                onClick={() => setFiles([])}
                                className="hover:text-red-400 transition-colors"
                            >
                                Clear all
                            </button>
                        </div>

                        <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-2">
                            <AnimatePresence>
                                {files.map((file) => (
                                    <Reorder.Item
                                        key={file.id}
                                        value={file}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <div className="group flex items-center p-3 bg-slate-800/50 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                                            <div className="cursor-grab active:cursor-grabbing p-2 text-slate-500 hover:text-slate-300">
                                                <GripVertical className="w-5 h-5" />
                                            </div>

                                            <div className="p-2 bg-red-500/10 rounded-lg mr-3">
                                                <FileIcon className="w-5 h-5 text-red-400" />
                                            </div>

                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">
                                                    {file.file.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
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
                            onClick={handleMerge}
                            disabled={isProcessing || files.length < 2}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all shadow-lg ${isProcessing || files.length < 2
                                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-cyan-500/20"
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Merging PDFs...</span>
                                </>
                            ) : (
                                <>
                                    <Combine className="w-6 h-6" />
                                    <span>Merge PDF Files</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
