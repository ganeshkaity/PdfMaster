"use client";

import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Scale, FileWarning } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
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
                            Terms & Conditions
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
                        className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                    >
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-slate-200 mb-0">
                                    By accessing and using Allyono Apps, you accept and agree to be bound by the terms and provisions
                                    of this agreement. Please read these Terms & Conditions carefully before using our services.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Section 1: Service Provider */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-3 mb-4">
                            <Scale className="w-6 h-6 text-cyan-400 mt-1" />
                            <h2 className="text-white font-bold text-2xl mt-0">1. Service Provider</h2>
                        </div>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                This website is operated by <strong className="text-white">Ganesh Kaity</strong>, an individual based in India.
                            </p>
                            <p>
                                <strong className="text-white">Governing Law:</strong> These Terms shall be governed and construed in
                                accordance with the laws of India, without regard to its conflict of law provisions.
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 2: Service Description */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">2. Service Description</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                Allyono Apps provides online PDF and document tools for general informational and productivity purposes only.
                            </p>
                            <p className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                                <strong className="text-white">Privacy Notice:</strong> All files are processed locally in the user's browser.
                                We do not upload, store, or retain any user files on our servers.
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 3: No Warranties */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <div className="flex items-start space-x-3 mb-4">
                            <FileWarning className="w-6 h-6 text-orange-400 mt-1" />
                            <h2 className="text-white font-bold text-2xl mt-0">3. No Warranties & "As Is" Service</h2>
                        </div>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                <strong className="text-white">The website and its tools are provided on an "AS IS" and "AS AVAILABLE" basis,
                                    without warranties of any kind, express or implied.</strong>
                            </p>
                            <p>While we strive to provide accurate and reliable tools, we do not guarantee that:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>The results generated by the tools will be error-free, complete, or suitable for all purposes</li>
                                <li>The tools will be uninterrupted, timely, secure, or error-free</li>
                                <li>The quality of any products, services, information obtained through the website will meet your expectations</li>
                            </ul>
                        </div>
                    </motion.section>

                    {/* Section 4: User Responsibilities */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">4. User Responsibilities</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>By using our service, you agree that:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>
                                    <strong className="text-white">You are solely responsible</strong> for verifying the accuracy and
                                    suitability of any output files produced using our tools before relying on them
                                </li>
                                <li>
                                    <strong className="text-white">You are advised to keep backups</strong> of your original files before
                                    using any file processing tools on this website
                                </li>
                                <li>
                                    <strong className="text-white">You use the tools at your own risk</strong>
                                </li>
                                <li>You will not use the service for any illegal or unauthorized purpose</li>
                                <li>You will not upload files containing malicious code, viruses, or harmful content</li>
                            </ul>
                        </div>
                    </motion.section>

                    {/* Section 5: Limitation of Liability */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">5. Limitation of Liability</h2>
                        <div className="text-slate-300 space-y-4">
                            <p className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-100">
                                <strong>IMPORTANT:</strong> Allyono Apps is not responsible for any loss of data, corruption of files,
                                or damages resulting from the use or inability to use the website or its tools.
                            </p>
                            <p>
                                <strong className="text-white">Allyono Apps shall not be held liable for any direct, indirect, incidental,
                                    or consequential damages arising from the use of this website.</strong>
                            </p>
                            <p>This includes but is not limited to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Loss of data or files</li>
                                <li>File corruption or quality degradation</li>
                                <li>Business interruption</li>
                                <li>Loss of profits or revenue</li>
                                <li>Failure to meet expectations or requirements</li>
                            </ul>
                        </div>
                    </motion.section>

                    {/* Section 6: No Professional Advice */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">6. No Professional Advice</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                <strong className="text-white">We do not provide professional, legal, financial, or technical advice</strong> through
                                this website or its tools.
                            </p>
                            <p>
                                You should consult with appropriate professionals for specific advice tailored to your situation.
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 7: External Links */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">7. External Links & Third-Party Services</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                External links or third-party services referenced on this website are provided for convenience only.
                                <strong className="text-white"> We do not endorse or take responsibility for their content or practices.</strong>
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 8: Intellectual Property */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">8. Intellectual Property</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                The design, code, and content of this website are the property of Ganesh Kaity and are protected by
                                applicable copyright and trademark laws.
                            </p>
                            <p>
                                <strong className="text-white">Your files remain your property.</strong> We make no claim to ownership of
                                any files you process using our tools.
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 9: Modifications */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-white/5"
                    >
                        <h2 className="text-white font-bold text-2xl mb-4">9. Changes to Terms</h2>
                        <div className="text-slate-300 space-y-4">
                            <p>
                                This disclaimer may be updated from time to time without prior notice. Continued use of the website
                                indicates acceptance of the updated disclaimer.
                            </p>
                            <p>
                                We reserve the right to modify or discontinue the service (or any part thereof) at any time, with or
                                without notice.
                            </p>
                        </div>
                    </motion.section>

                    {/* Section 10: Acceptance */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                        className="p-6 rounded-xl bg-green-500/10 border border-green-500/20"
                    >
                        <h2 className="text-white font-bold text-xl mb-3 mt-0">10. Acceptance of Terms</h2>
                        <p className="text-slate-200 mb-0">
                            <strong>By using this website, you acknowledge that you have read, understood, and agree to be bound by
                                these Terms & Conditions.</strong> If you do not agree to these terms, please do not use our services.
                        </p>
                    </motion.section>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="text-center mt-12 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20"
                    >
                        <p className="text-slate-300 mb-4">
                            Questions about these terms? Contact us:
                        </p>
                        <a
                            href="mailto:ganeshkaitycodechannel@gmail.com"
                            className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                        >
                            ganeshkaitycodechannel@gmail.com
                        </a>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
