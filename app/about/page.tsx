"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Target, Code } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center text-slate-400 hover:text-cyan-400 transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                            About Allyono Apps
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400">Your trusted PDF utility platform</p>
                </motion.div>

                {/* Content Cards */}
                <div className="space-y-6">
                    {/* Mission */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-cyan-500/10 rounded-lg">
                                <Target className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-3">Our Mission</h2>
                                <p className="text-slate-300 leading-relaxed">
                                    Allyono Apps is an all-in-one PDF tool designed to provide a clean, fast, and secure experience
                                    for PDF conversion and editing. We believe in <strong>privacy-first</strong> technology — all files
                                    are processed locally in your browser, meaning <strong>we never upload or store your documents</strong>.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Founder */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <User className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-3">The Team</h2>
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Allyono Apps is a <strong>one-man project</strong> founded and maintained by <strong>Ganesh Kaity</strong>,
                                    a passionate student developer from Bankura, West Bengal, India.
                                </p>
                                <p className="text-slate-300 leading-relaxed">
                                    As a solo developer, I'm committed to building tools that not only work efficiently but also
                                    respect user privacy and provide a delightful user experience.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Founded */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-3">Our Journey</h2>
                                <p className="text-slate-300 leading-relaxed">
                                    Founded on <strong>January 8, 2026</strong>, Allyono Apps started with a simple goal:
                                    to make PDF manipulation accessible, secure, and free for everyone. What began as a personal project
                                    has grown into a comprehensive suite of PDF tools used by people around the world.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Technology */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <Code className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-3">Built with Modern Technology</h2>
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Allyono Apps is built using cutting-edge web technologies including Next.js, React, and TypeScript.
                                    All PDF processing happens in your browser using powerful client-side libraries, ensuring:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-slate-300">
                                    <li><strong>Complete Privacy:</strong> Your files never leave your device</li>
                                    <li><strong>Fast Processing:</strong> No server uploads mean instant results</li>
                                    <li><strong>No File Limits:</strong> Process files of any size</li>
                                    <li><strong>100% Free:</strong> No subscriptions, no hidden fees</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-12"
                >
                    <p className="text-slate-400 mb-6">
                        Have questions or feedback? We'd love to hear from you!
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                    >
                        Get in Touch
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
