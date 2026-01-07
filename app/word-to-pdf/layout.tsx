import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Word to PDF Online Free – Allyono Apps",
    description: "Convert Word documents (DOCX) to PDF online for free. Preserve formatting and layout securely in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
