"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ToolLayoutProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

export default function ToolLayout({ title, description, icon, children }: ToolLayoutProps) {
    return (
        <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-slate-400 hover:text-cyan-400 transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Tools
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        {icon && (
                            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 mb-2">
                                {icon}
                            </div>
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-slate-300">
                            {title}
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            {description}
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 opacity-50" />
                    <div className="absolute -left-20 top-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -right-20 bottom-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
