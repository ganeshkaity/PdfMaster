"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, File as FileIcon, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface FileDropZoneProps {
    onFilesSelected: (files: File[]) => void;
    accept?: Record<string, string[]>;
    maxFiles?: number;
    title?: string;
    description?: string;
    className?: string;
}

export default function FileDropZone({
    onFilesSelected,
    accept = { "application/pdf": [".pdf"] },
    maxFiles = 0, // 0 means unlimited
    title = "Drop your PDF here",
    description = "or click to browse files",
    className,
}: FileDropZoneProps) {
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setError(null);
        if (fileRejections.length > 0) {
            setError(fileRejections[0].errors[0].message);
            return;
        }
        if (acceptedFiles.length > 0) {
            onFilesSelected(acceptedFiles);
        }
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: maxFiles > 0 ? maxFiles : undefined,
    });

    return (
        <div className={clsx("w-full", className)}>
            <motion.div
                {...getRootProps()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={clsx(
                    "relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden",
                    isDragActive
                        ? "border-cyan-400 bg-cyan-400/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-cyan-500/50 hover:bg-slate-800/50"
                )}
            >
                <input {...getInputProps()} />

                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="z-10 flex flex-col items-center space-y-4 text-center p-6">
                    <div className={clsx(
                        "p-4 rounded-full bg-slate-800 border border-slate-700 shadow-xl transition-transform duration-300",
                        isDragActive ? "scale-110 rotate-12" : "group-hover:scale-110"
                    )}>
                        <Upload className={clsx("w-8 h-8", isDragActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-400")} />
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white">
                            {isDragActive ? "Drop to upload" : title}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {description}
                        </p>
                    </div>
                </div>

                {/* corner accents */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center space-x-2 text-red-400 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
