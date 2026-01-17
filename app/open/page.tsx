"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ToolCard from "../components/ui/ToolCard";
import { allTools } from "../page"; // Import tools from home
import { saveSharedFile } from "../lib/pwa-file-store";
import { Loader2, FileIcon } from "lucide-react";

declare global {
    interface Window {
        launchQueue?: {
            setConsumer: (callback: (launchParams: any) => void) => void;
        };
    }
}

export default function OpenPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if ("launchQueue" in window && window.launchQueue) {
            window.launchQueue.setConsumer(async (launchParams) => {
                if (launchParams.files && launchParams.files.length > 0) {
                    const fileHandle = launchParams.files[0];
                    const file = await fileHandle.getFile();
                    setFile(file);

                    // Store it for the next page
                    await saveSharedFile(file);
                    setIsReady(true);
                }
            });
        } else {
            // Fallback for testing or direct access
            setIsReady(true);
        }
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    // Filter tools based on file type if possible?
    // For now, show all tools as "All-in-One" editor implies flexibility.
    // But we can gray out incompatible ones later. 
    // User asked to "open with all tools".

    return (
        <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold mb-6"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                            Open File With...
                        </span>
                    </motion.h1>

                    {file ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-xl border border-cyan-500/30 text-cyan-100"
                        >
                            <FileIcon className="w-6 h-6 text-cyan-400" />
                            <span className="font-medium text-lg">{file.name}</span>
                            <span className="text-slate-400 text-sm">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </motion.div>
                    ) : (
                        <p className="text-slate-400 animate-pulse">Waiting for file...</p>
                    )}
                </div>

                {/* Tools Grid - Reuse existing cards */}
                {isReady && (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {allTools.map((tool) => (
                            <motion.div key={tool.title} variants={item}>
                                {/* ToolCard links normally. When clicked, the user navigates to the tool page. The tool page will check IDB for the file. */}
                                <ToolCard {...tool} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
