"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, FileText, Settings, Image as ImageIcon, Slice, Move, Shield } from "lucide-react";

const tools = [
    { name: "Edit PDF", href: "/edit-pdf", icon: FileText },
    { name: "Compress PDF", href: "/compress-pdf", icon: Settings },
    { name: "Merge PDFs", href: "/merge-pdf", icon: FileText },
    { name: "Split PDF", href: "/split-pdf", icon: Slice },
    { name: "PDF to JPG", href: "/pdf-to-jpg", icon: ImageIcon },
    // Add more tools as we implement them
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="relative z-50 w-full glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative w-10 h-10 overflow-hidden rounded-xl group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all">
                            <Image
                                src="/logo.png"
                                alt="Allyono Apps Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Allyono<span className="text-cyan-400">Apps</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                            Home
                        </Link>

                        <div
                            className="relative"
                            onMouseEnter={() => setIsOpen(true)}
                            onMouseLeave={() => setIsOpen(false)}
                        >
                            <button className="flex items-center space-x-1 text-sm font-medium text-slate-300 hover:text-white transition-colors py-2">
                                <span>All Tools</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 top-full mt-2 w-64 glass rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                                    >
                                        <div className="p-2 grid gap-1">
                                            {tools.map((tool) => (
                                                <Link
                                                    key={tool.name}
                                                    href={tool.href}
                                                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group"
                                                >
                                                    <tool.icon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                                                    <span className="text-sm text-slate-200 group-hover:text-white">{tool.name}</span>
                                                </Link>
                                            ))}
                                            <div className="border-t border-white/10 my-1"></div>
                                            <Link
                                                href="."
                                                className="block px-3 py-2 text-xs text-center text-slate-400 hover:text-white hover:underline"
                                            >
                                                View all 20+ tools
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-slate-300 hover:text-white p-2"
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass border-t border-white/10 overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-2">
                            <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200">Home</Link>
                            <div className="px-3 py-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tools</p>
                                <div className="grid grid-cols-1 gap-1">
                                    {tools.map((tool) => (
                                        <Link
                                            key={tool.name}
                                            href={tool.href}
                                            className="flex items-center space-x-2 py-2 text-slate-300 hover:text-white"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <tool.icon className="w-4 h-4 text-cyan-400" />
                                            <span>{tool.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
