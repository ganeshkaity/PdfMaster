"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { FileText, File as FileIcon, Loader2, Download } from "lucide-react";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import * as pdfjsLib from "pdfjs-dist";

// Worker config
// Configure worker. Note: In Next.js app router, it's often best to use a CDN or local public file.
// We use unpkg CDN for simplicity and reliability in this setup.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Force dynamic rendering (disable static generation) since pdfjs-dist requires browser APIs
export const dynamic = 'force-dynamic';

export default function PdfToWordPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) setFile(files[0]);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Extracting text...");

        try {
            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(buffer).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                toast.loading(`Processing page ${i} of ${pdf.numPages}...`, { id: loadingToast });
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Basic text reconstruction
                const pageText = textContent.items
                    // @ts-ignore
                    .map((item) => item.str)
                    .join(" "); // This loses structure, but is "Client-side possible"

                fullText += `<p>${pageText}</p><br/>`; // Wrap in HTML suitable for Word
            }

            // Create a pseudo-Word doc using HTML
            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
            const footer = "</body></html>";
            const sourceHTML = header + fullText + footer;

            const blob = new Blob([sourceHTML], { type: "application/msword" });
            saveAs(blob, `${file.name.replace(".pdf", "")}.doc`);

            toast.success("Document created!", { id: loadingToast });

        } catch (error) {
            console.error(error);
            toast.error("Failed to convert to Word", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="PDF to Word"
            description="Convert PDF files to editable Word documents. (Text extraction)"
            icon={<FileText className="w-10 h-10 text-cyan-400" />}
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
                                onClick={() => { setFile(null); }}
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
                                    <span>Download Word Doc</span>
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-500">
                            Note: Complex layouts may lose some formatting. Best for text-heavy documents.
                        </p>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
