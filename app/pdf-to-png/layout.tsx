import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF to PNG Online Free – Allyono Apps",
    description: "Convert PDF to PNG online for free. High-quality image extraction from PDF files securely in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
