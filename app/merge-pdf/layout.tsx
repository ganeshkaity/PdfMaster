import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Merge PDF Online Free – Allyono Apps",
    description: "Merge multiple PDF files into one online for free. Combine PDFs easily and securely without uploading to a server.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
