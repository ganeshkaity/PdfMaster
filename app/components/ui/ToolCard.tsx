"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";

interface ToolCardProps {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    color?: string; // Optional gradient color override
}

export default function ToolCard({ title, description, href, icon: Icon }: ToolCardProps) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ y: -5 }}
                className="group relative h-full p-6 rounded-2xl glass border border-white/5 hover:border-cyan-500/30 transition-colors overflow-hidden"
            >
                {/* Hover Gradient Blob */}
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-all duration-500" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-4 inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10 group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-colors">
                        <Icon className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-grow">{description}</p>

                    <div className="flex items-center text-sm font-medium text-cyan-400 group-hover:translate-x-1 transition-transform">
                        <span>Open Tool</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
