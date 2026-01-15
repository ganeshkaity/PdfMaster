import React, { useEffect } from 'react';
import { Loader2, Zap } from 'lucide-react';

interface ProcessingModalProps {
    isOpen: boolean;
    progress: number; // 0 to 100
    currentStep: string;
    subText?: string;
    totalPages: number;
    processedPages: number;
    estimatedTimeRemaining?: string;
}

export default function ProcessingModal({
    isOpen,
    progress,
    currentStep,
    subText,
    totalPages,
    processedPages,
    estimatedTimeRemaining
}: ProcessingModalProps) {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                const scrollY = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 pt-24">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center max-h-[90vh] overflow-y-auto custom-scrollbar">

                {/* Glow Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">

                    {/* Glowing Loader */}
                    <div className="relative mb-8">
                        {/* Outer rotating ring */}
                        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500/0 animate-spin" style={{ animationDuration: '3s' }} />
                        <svg className="w-24 h-24 animate-spin-slow text-purple-600" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100 200" strokeLinecap="round" />
                        </svg>

                        {/* Inner Gradient Circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.5)]">
                            <Zap className="w-8 h-8 text-white animate-pulse" />
                        </div>
                    </div>

                    {/* Status Text */}
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 mb-2">
                        {currentStep}
                    </h3>

                    <p className="text-slate-400 text-sm mb-8">
                        {subText || `Batch: Extracted page ${processedPages} of ${totalPages}`}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4 relative">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-3xl font-bold text-white tabular-nums tracking-tight">{Math.round(progress)}%</span>
                        {estimatedTimeRemaining && (
                            <span className="text-xs text-slate-500 font-medium">{estimatedTimeRemaining} remaining</span>
                        )}
                    </div>

                </div>
            </div>

            <style jsx>{`
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}
