"use client";

import ToolLayout from "../components/tools/ToolLayout";
import { MonitorPlay } from "lucide-react";
import Link from "next/link";

export default function PptPlaceholder() {
    return (
        <ToolLayout
            title="Presentation Tools"
            description="PowerPoint conversion tools coming soon!"
            icon={<MonitorPlay className="w-10 h-10 text-cyan-400" />}
        >
            <div className="text-center py-20 space-y-6">
                <h2 className="text-2xl font-bold text-white">🚧 Under Construction</h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    We are working hard to bring client-side PowerPoint conversions to PDFMaster.
                    Converting complex slideshows requires heavy processing that is being optimized.
                </p>
                <Link href="/" className="inline-block px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">
                    Explore Other Tools
                </Link>
            </div>
        </ToolLayout>
    );
}
