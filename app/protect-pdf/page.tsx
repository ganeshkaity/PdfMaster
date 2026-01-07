"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { Lock, File as FileIcon, Loader2, Download, ShieldCheck } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

export default function ProtectPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) setFile(files[0]);
    };

    const handleProtect = async () => {
        if (!file || !password) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Encrypting PDF...");

        try {
            const buffer = await file.arrayBuffer();
            const srcPdf = await PDFDocument.load(buffer);

            // Create a brand new PDF to avoid any weird state from the source
            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(srcPdf, srcPdf.getPageIndices());
            copiedPages.forEach((page) => newPdf.addPage(page));

            // @ts-ignore
            if (typeof newPdf.encrypt !== 'function') {
                console.error("PDFDocument instance methods:", Object.keys(newPdf));
                // @ts-ignore
                console.error("Prototype methods:", Object.keys(Object.getPrototypeOf(newPdf)));
                throw new Error("Encryption is not supported by the loaded pdf-lib version. Please restart the dev server.");
            }

            // @ts-ignore
            newPdf.encrypt({
                userPassword: password,
                ownerPassword: password,
                permissions: {
                    printing: "highResolution",
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentAccessibility: false,
                    documentAssembly: false,
                },
            });

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            saveAs(blob, `${file.name.replace(".pdf", "")}_protected.pdf`);
            toast.success("PDF Protected!", { id: loadingToast });

        } catch (error) {
            console.error(error);
            toast.error("Failed to protect PDF", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Protect PDF"
            description="Encrypt your PDF file with a password. Secure sensitive data."
            icon={<Lock className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                {!file ? (
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        title="Drop PDF to protect"
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
                                onClick={() => { setFile(null); setPassword(""); }}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                Change File
                            </button>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                            <label className="block text-sm font-medium text-slate-300">Set Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter a strong password"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <p className="text-xs text-slate-500 flex items-center">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                AES-128 Encryption Standard
                            </p>
                        </div>

                        <button
                            onClick={handleProtect}
                            disabled={isProcessing || !password}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Encrypting...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6" />
                                    <span>Protect & Download</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
