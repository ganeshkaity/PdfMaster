import { Metadata } from "next";

export const metadata: Metadata = {
    title: "HTML to PDF Online Free – Allyono Apps",
    description: "Convert HTML to PDF online for free. Paste HTML code or upload files to generate PDF documents securely.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
