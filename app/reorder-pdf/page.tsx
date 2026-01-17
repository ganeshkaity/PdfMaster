"use client";

import { useState } from "react";
import OrganizePdfPage from "../organize-pdf/page";
import { usePWAFile } from "../hooks/usePWAFile";

export default function ReorderPdfPage() {
    const [pwaFile, setPwaFile] = useState<File | undefined>(undefined);

    usePWAFile((file) => {
        setPwaFile(file);
    });

    return <OrganizePdfPage initialFile={pwaFile} />;
}
