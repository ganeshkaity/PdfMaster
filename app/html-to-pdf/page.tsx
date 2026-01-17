"use client";

import { useState, useRef } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import { Code, File as FileIcon, Loader2, Download, MonitorPlay } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { usePWAFile } from "../hooks/usePWAFile";

export default function HtmlToPdfPage() {
    const [htmlCode, setHtmlCode] = useState("<h1>Hello World</h1>\n<p>This is a sample HTML content.</p>");
    const [isProcessing, setIsProcessing] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    usePWAFile(async (file) => {
        if (file) {
            const text = await file.text();
            setHtmlCode(text);
        }
    });

    const handleConvert = async () => {
        if (!previewRef.current) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Generating PDF...");

        try {
            const element = previewRef.current;
            const canvas = await html2canvas(element, { scale: 2 } as any);
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgProps = (pdf as any).getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("html-converted.pdf");

            toast.success("PDF Downloaded!", { id: loadingToast });

        } catch (error) {
            console.error(error);
            toast.error("Failed to convert HTML to PDF", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="HTML to PDF"
            description="Convert raw HTML code or web snippets into a PDF document."
            icon={<Code className="w-10 h-10 text-cyan-400" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                {/* Editor */}
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center text-slate-300">
                        <h3 className="font-medium flex items-center"><Code className="w-4 h-4 mr-2" /> HTML Input</h3>
                    </div>
                    <textarea
                        value={htmlCode}
                        onChange={(e) => setHtmlCode(e.target.value)}
                        className="flex-grow w-full bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-sm text-slate-300 resize-none focus:ring-2 focus:ring-cyan-500 outline-none"
                        placeholder="<html>...</html>"
                    />
                </div>

                {/* Preview */}
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center text-slate-300">
                        <h3 className="font-medium flex items-center"><MonitorPlay className="w-4 h-4 mr-2" /> Live Preview (A4 Width)</h3>
                    </div>
                    <div className="flex-grow bg-white rounded-xl overflow-hidden shadow-lg border border-slate-700 relative">
                        <div className="absolute inset-0 overflow-auto p-8">
                            <div
                                ref={previewRef}
                                className="prose prose-sm max-w-none text-black bg-white min-h-full"
                                dangerouslySetInnerHTML={{ __html: htmlCode }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleConvert}
                        disabled={isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Converting...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-6 h-6" />
                                <span>Download PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </ToolLayout>
    );
}
