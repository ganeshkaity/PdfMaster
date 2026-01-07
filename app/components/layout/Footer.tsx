"use client";

import Link from "next/link";
import { Shield, Mail, FileText, Info } from "lucide-react";

export default function Footer() {
    return (
        <footer className="relative mt-20 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl">
            {/* Privacy Notice Banner */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-center space-x-3 text-cyan-100">
                        <Shield className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm md:text-base font-medium text-center">
                            Files are processed locally in your browser. We do not upload or store your documents.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* About Section */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Allyono Apps</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Your all-in-one PDF solution. Edit, convert, compress, and manage PDF files with ease —
                            all processed securely in your browser.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm flex items-center space-x-2">
                                    <Info className="w-4 h-4" />
                                    <span>About Us</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm flex items-center space-x-2">
                                    <Mail className="w-4 h-4" />
                                    <span>Contact & Support</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm flex items-center space-x-2">
                                    <FileText className="w-4 h-4" />
                                    <span>Privacy Policy</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm flex items-center space-x-2">
                                    <FileText className="w-4 h-4" />
                                    <span>Terms & Conditions</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-slate-500 text-sm">
                            © 2026 Allyono Apps. All rights reserved.
                        </p>
                        <p className="text-slate-600 text-xs">
                            Made with ❤️ by Ganesh Kaity
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
