"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Mail, MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
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
                            Contact Us
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400">We're here to help and answer any questions</p>
                </motion.div>

                {/* Contact Info Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Email */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-cyan-500/10 rounded-lg">
                                <Mail className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Email Support</h3>
                                <a
                                    href="mailto:ganeshkaitycodechannel@gmail.com"
                                    className="text-cyan-400 hover:text-cyan-300 transition-colors break-all"
                                >
                                    ganeshkaitycodechannel@gmail.com
                                </a>
                                <p className="text-slate-400 text-sm mt-2">
                                    For general inquiries and support
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Location */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <MapPin className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Location</h3>
                                <p className="text-slate-300">
                                    Bankura, West Bengal
                                </p>
                                <p className="text-slate-300">
                                    India
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Feedback Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                >
                    <div className="flex items-start space-x-4 mb-6">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Support & Feedback Form</h2>
                            <p className="text-slate-300">
                                Have a question, found a bug, or want to suggest a feature? Fill out our feedback form below.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                        <iframe
                            src="https://forms.gle/pp4jHEHnaE16dSmbA"
                            width="100%"
                            height="800"
                            frameBorder="0"
                            marginHeight={0}
                            marginWidth={0}
                            className="rounded-lg"
                        >
                            Loading feedback form...
                        </iframe>
                    </div>

                    <p className="text-slate-500 text-sm mt-4 text-center">
                        We typically respond within 24-48 hours
                    </p>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20"
                >
                    <h3 className="text-white font-bold mb-2">Before You Contact Us</h3>
                    <ul className="text-slate-300 space-y-2 text-sm">
                        <li>• All our tools work offline in your browser — no files are uploaded to servers</li>
                        <li>• Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)</li>
                        <li>• For large files, ensure you have sufficient RAM available</li>
                        <li>• Check our <Link href="/terms" className="text-cyan-400 hover:underline">Terms & Conditions</Link> for usage guidelines</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
