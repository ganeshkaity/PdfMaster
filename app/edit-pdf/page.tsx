"use client";

import { useState } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import { FileCog, File as FileIcon, Loader2, Download, Type, Image as ImageIcon } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

export default function EditPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Editor State
    const [text, setText] = useState("");
    const [textSize, setTextSize] = useState(12);
    const [textColor, setTextColor] = useState("#000000");
    const [xPos, setXPos] = useState(50);
    const [yPos, setYPos] = useState(500);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) setFile(files[0]);
    };

    const handleApply = async () => {
        if (!file) return;

        setIsProcessing(true);
        const loadingToast = toast.loading("Applying edits...");

        try {
            const buffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(buffer);
            const pages = pdf.getPages();
            const firstPage = pages[0]; // Apply to first page for MVP or all pages option

            // Add Text
            if (text) {
                // Simple hex to rgb conversion (approx)
                const r = parseInt(textColor.slice(1, 3), 16) / 255;
                const g = parseInt(textColor.slice(3, 5), 16) / 255;
                const b = parseInt(textColor.slice(5, 7), 16) / 255;

                firstPage.drawText(text, {
                    x: xPos,
                    y: yPos,
                    size: textSize,
                    color: rgb(r, g, b),
                });
            }

            // Add Image
            if (imageFile) {
                const imgBuffer = await imageFile.arrayBuffer();
                let image;
                try {
                    image = await pdf.embedJpg(imgBuffer);
                } catch {
                    image = await pdf.embedPng(imgBuffer);
                }

                if (image) {
                    const dims = image.scale(0.5);
                    firstPage.drawImage(image, {
                        x: xPos, // Using same pos for simplicity in this MVP editor
                        y: yPos - dims.height - 20,
                        width: dims.width,
                        height: dims.height,
                    });
                }
            }

            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            saveAs(blob, `${file.name.replace(".pdf", "")}_edited.pdf`);
            toast.success("Edits applied!", { id: loadingToast });

        } catch (error) {
            console.error(error);
            toast.error("Failed to edit PDF", { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolLayout
            title="Edit PDF"
            description="Add text, images, and annotations to your PDF pages."
            icon={<FileCog className="w-10 h-10 text-cyan-400" />}
        >
            <div className="space-y-8">
                {!file ? (
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        title="Drop PDF to edit"
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
                                    <p className="text-sm text-slate-400">Editing Page 1 (Coordinate-based)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); }}
                                className="text-slate-400 hover:text-white p-2"
                            >
                                Change File
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Text Tools */}
                            <div className="space-y-4 p-6 bg-slate-800/30 rounded-2xl border border-white/5">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Type className="w-5 h-5 text-cyan-400" />
                                    <h3 className="font-bold text-white">Add Text</h3>
                                </div>
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Enter text here..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none"
                                />
                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-slate-400">Size</label>
                                        <input
                                            type="number"
                                            value={textSize}
                                            onChange={(e) => setTextSize(Number(e.target.value))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-slate-400">Color</label>
                                        <input
                                            type="color"
                                            value={textColor}
                                            onChange={(e) => setTextColor(e.target.value)}
                                            className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Position Tools */}
                            <div className="space-y-4 p-6 bg-slate-800/30 rounded-2xl border border-white/5">
                                <div className="flex items-center space-x-2 mb-4">
                                    <ImageIcon className="w-5 h-5 text-purple-400" />
                                    <h3 className="font-bold text-white">Positioning & Image</h3>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400">X Position: {xPos}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="600"
                                        value={xPos}
                                        onChange={(e) => setXPos(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Y Position: {yPos} (0 = Bottom)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="800"
                                        value={yPos}
                                        onChange={(e) => setYPos(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="text-xs text-slate-400 block mb-1">Upload Image Overlay (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                                        className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-cyan-500/10 file:text-cyan-400
                        hover:file:bg-cyan-500/20
                      "
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleApply}
                            disabled={isProcessing || (!text && !imageFile)}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Applying Changes...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6" />
                                    <span>Apply & Download</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
