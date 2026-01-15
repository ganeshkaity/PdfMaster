import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface ProcessingViewProps {
    progress: number; // 0 to 100
    currentStep: string;
    subText?: string;
    totalPages: number;
    processedPages: number;
    estimatedTimeRemaining?: string;
}

export default function ProcessingView({
    progress,
    currentStep,
    subText,
    totalPages,
    processedPages,
    estimatedTimeRemaining
}: ProcessingViewProps) {
    // Determine random tip
    const tips = [
        "Inverting colors saves ink and improves readability in dark mode.",
        "Removing dark backgrounds creates cleaner, printer-friendly notes.",
        "Arranging multiple slides per page saves paper!",
        "Double-check your print preview before sending to the printer.",
        "Use 'Grayscale' for even faster printing.",
    ];
    const [tip, setTip] = useState(tips[0]);

    useEffect(() => {
        setTip(tips[Math.floor(Math.random() * tips.length)]);
        const interval = setInterval(() => {
            setTip(tips[Math.floor(Math.random() * tips.length)]);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-12 text-center relative overflow-hidden">

                {/* Back Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">

                    {/* Glowing Loader Big */}
                    <div className="relative mb-10 scale-125">
                        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500/0 animate-spin" style={{ animationDuration: '3s' }} />
                        <svg className="w-24 h-24 animate-spin-slow text-purple-600" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100 200" strokeLinecap="round" />
                        </svg>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.6)]">
                            <Zap className="w-8 h-8 text-white animate-pulse" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {currentStep}
                    </h2>

                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        {subText || `Processing page ${processedPages} of ${totalPages}... hold tight!`}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full max-w-lg h-2 bg-slate-800 rounded-full overflow-hidden mb-6 relative">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />
                    </div>

                    {/* Meta Stats */}
                    <div className="flex items-center gap-8 mb-10">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white tabular-nums">{Math.round(progress)}%</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Complete</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white tabular-nums">{estimatedTimeRemaining || "..."}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Remaining</div>
                        </div>
                    </div>

                    {/* Dynamic Tip */}
                    <div className="bg-slate-950/50 rounded-xl p-4 max-w-lg mx-auto border border-white/5">
                        <p className="text-purple-300 text-sm font-medium mb-1">💡 Did you know?</p>
                        <p className="text-slate-400 text-sm italic">"{tip}"</p>
                    </div>

                </div>
            </div>

            <style jsx>{`
                @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                @keyframes shimmer { 100% { transform: translateX(100%); } }
                .animate-shimmer { animation: shimmer 2s infinite; }
            `}</style>
        </div>
    );
}
