"use client";

import { useState, useRef } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { FileSpreadsheet, File as FileIcon, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { usePWAFile } from "../hooks/usePWAFile";

export default function ExcelToPdfPage() {
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

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Processing spreadsheet...");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const html = XLSX.utils.sheet_to_html(worksheet);

            setHtmlContent(html);

            setTimeout(async () => {
                if (previewRef.current) {
                    toast.loading("Generating PDF...", { id: loadingToast });

                    const element = previewRef.current;
                    // Styling the table for better PDF look
                    const table = element.querySelector("table");
                    if (table) {
                        table.style.width = "100%";
                        table.style.borderCollapse = "collapse";
                        table.querySelectorAll("td, th").forEach((c: any) => {
                            c.style.border = "1px solid #ddd";
                            c.style.padding = "8px";
                            c.style.fontSize = "12px";
                            c.style.textAlign = "left";
                        });
                    }

                    const canvas = await html2canvas(element, { scale: 1 } as any); // Scale 1 for spreadsheets to avoid huge images
                    const imgData = canvas.toDataURL("image/png");

                    const pdf = new jsPDF({
                        orientation: "landscape", // Excel usually wider
                        unit: "mm",
                        format: "a4",
                    });

                    const imgProps = (pdf as any).getImageProperties(imgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`${file.name.replace(".xlsx", "").replace(".xls", "")}.pdf`);

                    toast.success("Spreadsheet Converted!", { id: loadingToast });
                    setIsProcessing(false);
                    setHtmlContent("");
                }
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Failed to convert Excel file", { id: loadingToast });
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Excel to PDF"
            description="Convert XLSX spreadsheets to PDF format."
            icon={<FileSpreadsheet className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                {!file ? (
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }}
                        maxFiles={1}
                        title="Drop Excel file to convert"
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
                        </button>

                        {/* Hidden Preview Area */}
                        <div className="overflow-hidden h-0 opacity-0 relative">
                            <div ref={previewRef} className="bg-white p-4 w-[1200px] text-black" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
