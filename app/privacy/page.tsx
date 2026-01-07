"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Shield, Cookie, Database, Mail } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
                            Privacy Policy
                        </span>
                    </h1>
                    <p className="text-slate-400">Last updated: January 8, 2026</p>
                </motion.div>

                {/* Content */}
                <div className="prose prose-invert prose-cyan max-w-none space-y-8">
                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
                    >
                        <div className="flex items-start space-x-3">
                            <Shield className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                            <div>
                                <h2 className="text-white font-bold text-xl mb-2 mt-0">Your Privacy is Our Priority</h2>
                                <p className="text-slate-200 mb-0">
                                    Allyono Apps is operated by <strong>Ganesh Kaity</strong>. We are committed to protecting your privacy.
                                    This Privacy Policy explains how we handle your data when you use our website and services.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Section 1: Data Processing */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-3 mb-4">
                            <Database className="w-6 h-6 text-green-400 mt-1" />
                            <h2 className="text-white font-bold text-2xl mt-0">1. How We Process Your Files</h2>
                        </div>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                <strong className="text-white">All file processing happens locally in your browser.</strong> When you use our PDF tools:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Your files are processed entirely on your device using JavaScript</li>
                                <li><strong className="text-white">We do NOT upload your files to any server</strong></li>
                                <li><strong className="text-white">We do NOT store, save, or retain your files</strong></li>
                                <li>Your files never leave your browser</li>
                                <li>Once you close the page, your files are permanently deleted from your browser's memory</li>
                            </ul>
                        </div>
                    </motion.section>

                    {/* Section 2: Data Collection */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">2. Information We Collect</h2>
                        <div className="text-slate-300 space-y-4">
                            <p><strong className="text-white">We currently do not use any analytics tools.</strong></p>
                            <p>The only data collection that occurs is through:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Contact Form:</strong> If you submit our feedback form, Google Forms may collect your email and responses</li>
                                <li><strong>Email Support:</strong> If you email us, we retain your email and correspondence for support purposes</li>
                            </ul>
                        </div>
                    </motion.section>

                    {/* Section 3: Cookies & Advertising */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-3 mb-4">
                            <Cookie className="w-6 h-6 text-yellow-400 mt-1" />
                            <h2 className="text-white font-bold text-2xl mt-0">3. Cookies & Third-Party Advertising</h2>
                        </div>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                <strong className="text-white">We use Google AdSense to display advertisements on our website.</strong>
                            </p>
                            <p className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-100">
                                <strong>Important:</strong> Third-party vendors, including Google, may use cookies to display ads based on
                                your prior visits to this website or other websites.
                            </p>
                            <p>These cookies allow Google and its partners to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Serve ads to you based on your visit to our site and/or other sites on the Internet</li>
                                <li>Personalize ad content</li>
                                <li>Measure ad performance</li>
                            </ul>
                            <p>
                                You can opt out of personalized advertising by visiting{" "}
                                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                    Google's Ads Settings
                                </a>.
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 4: Your Rights */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">4. Your Rights</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>Since we don't collect or store your files, there is no personal file data to access, modify, or delete.</p>
                            <p>However, you have the right to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Use the website without providing any personal information</li>
                                <li>Control cookie settings in your browser</li>
                                <li>Opt out of personalized advertising (see Section 3)</li>
                                <li>Request deletion of any emails or feedback you've sent us</li>
                            </ul>
                        </div>
                    </motion.section>

                    {/* Section 5: Third-Party Links */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">5. External Links</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                Our website may contain links to external sites (such as our Google Form). We are not responsible
                                for the privacy practices of these external sites. Please review their privacy policies separately.
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 6: Children's Privacy */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">6. Children's Privacy</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                Our services are not directed to individuals under the age of 13. We do not knowingly collect
                                personal information from children under 13.
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 7: Changes to Policy */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">7. Changes to This Policy</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                We may update this Privacy Policy from time to time. We will notify users of any material changes
                                by updating the "Last updated" date at the top of this page.
                            </p>
                        </div>
                    </motion.section>

                    {/* Contact */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20"
                    >
                        <div className="flex items-start space-x-3">
                            <Mail className="w-6 h-6 text-blue-400 mt-1" />
                            <div>
                                <h2 className="text-white font-bold text-xl mb-2 mt-0">8. Contact Us</h2>
                                <p className="text-slate-200 mb-2">
                                    If you have any questions about this Privacy Policy, please contact us at:
                                </p>
                                <a href="mailto:ganeshkaityshorts@gmail.com" className="text-cyan-400 hover:underline">
                                    ganeshkaityshorts@gmail.com
                                </a>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
}
