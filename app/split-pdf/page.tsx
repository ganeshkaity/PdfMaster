"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { Scissors, File as FileIcon, Loader2, Download, Check, Layers, Copy } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function SplitPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [splitMode, setSplitMode] = useState<"all" | "range">("all");
    const [rangeInput, setRangeInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);

            try {
                const buffer = await selectedFile.arrayBuffer();
                const pdf = await PDFDocument.load(buffer);
                setPageCount(pdf.getPageCount());
                toast.success(`Loaded ${selectedFile.name} (${pdf.getPageCount()} pages)`);
            } catch (e) {
                toast.error("Failed to load PDF info");
            }
        }
    };

    const handleSplit = async () => {
        if (!file) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Splitting PDF...");

        try {
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buffer);
            const zip = new JSZip();

            if (splitMode === "all") {
                // Split every page
                for (let i = 0; i < pdfDoc.getPageCount(); i++) {
                    const newPdf = await PDFDocument.create();
                    const [page] = await newPdf.copyPages(pdfDoc, [i]);
                    newPdf.addPage(page);
                    const pdfBytes = await newPdf.save();
                    zip.file(`${file.name.replace(".pdf", "")}_page_${i + 1}.pdf`, pdfBytes);
                }

                const zipContent = await zip.generateAsync({ type: "blob" });
                saveAs(zipContent, `${file.name.replace(".pdf", "")}_split.zip`);
                toast.success("All pages extracted to ZIP!", { id: loadingToast });

            } else {
                // Split by range logic
                // Parse range: "1, 3-5, 8"
                const pagesToExtract = new Set<number>();
                const parts = rangeInput.split(",").map(p => p.trim());

                parts.forEach(part => {
                    if (part.includes("-")) {
                        const [start, end] = part.split("-").map(Number);
                        if (!isNaN(start) && !isNaN(end)) {
                            for (let i = start; i <= end; i++) pagesToExtract.add(i - 1);
                        }
                    } else {
                        const pageNum = Number(part);
                        if (!isNaN(pageNum)) pagesToExtract.add(pageNum - 1);
                    }
                });

                const sortedPages = Array.from(pagesToExtract).filter(p => p >= 0 && p < pdfDoc.getPageCount()).sort((a, b) => a - b);

                if (sortedPages.length === 0) {
                    throw new Error("No valid pages selected");
                }

                const newPdf = await PDFDocument.create();
                const copiedPages = await newPdf.copyPages(pdfDoc, sortedPages);
                copiedPages.forEach(p => newPdf.addPage(p));

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
                saveAs(blob, `${file.name.replace(".pdf", "")}_extracted.pdf`);
                toast.success("Pages extracted successfully!", { id: loadingToast });
            }

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to split PDF", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Split PDF"
            description="Extract pages from your PDF file. Split into individual pages or distinct new files."
            icon={<Scissors className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                {!file ? (
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        title="Drop PDF to split"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setSplitMode("all")}
                                className={`p-6 rounded-xl border-2 transition-all text-left space-y-2 ${splitMode === "all"
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                                    }`}
                            >
                                <Layers className={`w-6 h-6 ${splitMode === "all" ? "text-cyan-400" : "text-slate-400"}`} />
                                <h4 className="font-bold text-white">Extract All Pages</h4>
                                <p className="text-sm text-slate-400">Save every page as a separate PDF file (downloaded as ZIP).</p>
                            </button>

                            <button
                                onClick={() => setSplitMode("range")}
                                className={`p-6 rounded-xl border-2 transition-all text-left space-y-2 ${splitMode === "range"
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                                    }`}
                            >
                                <Copy className={`w-6 h-6 ${splitMode === "range" ? "text-cyan-400" : "text-slate-400"}`} />
                                <h4 className="font-bold text-white">Select Pages</h4>
                                <p className="text-sm text-slate-400">Extract specific pages or ranges to a new PDF.</p>
                            </button>
                        </div>

                        {splitMode === "range" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-slate-300">Pages to extract (e.g., 1, 3-5, 10)</label>
                                <input
                                    type="text"
                                    value={rangeInput}
                                    onChange={(e) => setRangeInput(e.target.value)}
                                    placeholder="Example: 1-5, 8, 11-13"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                                />
                            </motion.div>
                        )}

                        <button
                            onClick={handleSplit}
                            disabled={isProcessing || (splitMode === "range" && !rangeInput)}
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
                                    <span>{splitMode === "all" ? "Split & Download ZIP" : "Extract & Download PDF"}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
