"use client";

import { useState, useRef } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { FileText, File as FileIcon, Loader2, Download } from "lucide-react";
import mammoth from "mammoth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { usePWAFile } from "../hooks/usePWAFile";

export default function WordToPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);
    const [htmlContent, setHtmlContent] = useState("");

    usePWAFile((file) => {
        handleFileSelected([file]);
    });

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) setFile(files[0]);
    };

    const handleJsonConversion = async () => {
        if (!file) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Measuring document...");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setHtmlContent(result.value);

            // Allow time for DOM to render
            setTimeout(async () => {
                if (previewRef.current) {
                    toast.loading("Generating PDF...", { id: loadingToast });

                    const canvas = await html2canvas(previewRef.current, { scale: 2 } as any);
                    const imgData = canvas.toDataURL("image/png");

                    const pdf = new jsPDF({
                        orientation: "portrait",
                        unit: "mm",
                        format: "a4",
                    });

                    const imgProps = (pdf as any).getImageProperties(imgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                    // Basic page split logic for long images
                    // Since simple addImage will stretch or cut if too long, we might need multiple pages.
                    // For MVP, we stick to single long page or standard addImage which might handle basic cases or fit-to-page.
                    // Better: Calculate height left and add pages.

                    let heightLeft = pdfHeight;
                    let position = 0;
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - pdfHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save(`${file.name.replace(".docx", "").replace(".doc", "")}.pdf`);
                    toast.success("PDF Downloaded!", { id: loadingToast });
                    setIsProcessing(false);
                }
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Failed to convert Word file", { id: loadingToast });
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Word to PDF"
            description="Convert DOCX files to PDF while preserving basic formatting."
            icon={<FileText className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                {!file ? (
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }}
                        maxFiles={1}
                        title="Drop Word file to convert"
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
                                onClick={() => { setFile(null); setHtmlContent(""); }}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                Change File
                            </button>
                        </div>

                        <button
                            onClick={handleJsonConversion}
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
                        </button>

                        {/* Hidden Preview Area for Rendering */}
                        <div className="overflow-hidden h-0 opacity-0 relative">
                            <div ref={previewRef} className="bg-white p-10 w-[794px] min-h-[1123px] text-black prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
