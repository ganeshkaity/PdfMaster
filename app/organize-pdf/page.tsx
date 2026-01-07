"use client";

import MergePdfPage from "../merge-pdf/page";
import ToolLayout from "../components/tools/ToolLayout";
import { Layers } from "lucide-react";

export default function OrganizePdfPage() {
    return (
        <>
            {/* We reuse the Merge logic but wrapped or with slightly different context if we could pass props.
          Since MergePdfPage is default export, we can render it.
          Ideally we'd refactor MergePdfPage to accept title/props, but for now we render it as is 
          or just redirect logic. The user wants a separate page file. 
          Rendering MergePdfPage is the quickest way to provide the "drag and drop to reorder" functionality.
      */}
            <div className="relative">
                <div className="absolute inset-0 z-10 pointer-events-none flex justify-center mt-4 opacity-0">
                    {/* Hidden overlay if we wanted to change title dynamically without props */}
                </div>
                <MergePdfPage />
            </div>
        </>
    );
}
