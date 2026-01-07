import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PPT to PDF Online Free – Allyono Apps",
    description: "Convert PowerPoint (PPT, PPTX) to PDF online for free. Presentation to PDF conversion securely.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
