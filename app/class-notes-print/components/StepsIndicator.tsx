import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepsIndicatorProps {
    currentStep: number;
    steps: string[];
}

export default function StepsIndicator({ currentStep, steps }: StepsIndicatorProps) {
    return (
        <div className="w-full max-w-4xl mx-auto mb-12 px-4">
            <div className="relative flex items-center justify-between">
                {/* Connecting Line - Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full -z-10" />

                {/* Connecting Line - Filled */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full -z-10 transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((label, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center gap-3 relative">
                            {/* Circle */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.2 : 1,
                                    backgroundColor: isCompleted || isActive ? '#a855f7' : '#1e293b', // purple-500 : slate-800
                                    borderColor: isCompleted || isActive ? '#a855f7' : '#334155', // slate-700
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-300 z-10 ${isCompleted || isActive
                                    ? 'shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                                    : 'bg-slate-900 border-slate-700 shadow-xl'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 text-white stroke-[3]" />
                                ) : (
                                    <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                        {index + 1}
                                    </span>
                                )}
                            </motion.div>

                            {/* Label */}
                            <span className={`absolute top-full mt-2 text-xs font-medium whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                                } ${isActive ? 'block' : 'hidden sm:block'
                                }`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
