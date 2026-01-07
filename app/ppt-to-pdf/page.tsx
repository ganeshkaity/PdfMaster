"use client";

import ToolLayout from "../components/tools/ToolLayout";
import { MonitorPlay } from "lucide-react";
import Link from "next/link";

export default function PptPlaceholder() {
    return (
        <ToolLayout
            title="PPT to PDF"
            description="Convert PowerPoint presentations to PDF format."
            icon={<MonitorPlay className="w-10 h-10 text-cyan-400" />}
        >
            <div className="text-center py-20 space-y-6">
                <h2 className="text- 2xl font-bold text-white">⚠️ Advanced Feature</h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    PowerPoint to PDF conversion requires complex processing and is currently being optimized.
                    For now, you can use PowerPoint's built-in "Save as PDF" or "Export to PDF" feature for best results.
                </p>
                <Link href="/" className="inline-block px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">
                    Explore Other Tools
                </Link>
            </div>
        </ToolLayout>
    );
}
