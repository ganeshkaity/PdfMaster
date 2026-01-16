import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Print Class Notes - Revert, Edit, layout, Download in Free",
    description: "Optimize and customize your class notes PDF for printing. Remove backgrounds, adjust layouts, and edit pages easily.",
};

export default function ClassNotesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
