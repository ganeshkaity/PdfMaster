import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Edit PDF Online Free – Allyono Apps",
    description: "Edit PDF files online for free. Add text, images, annotations, and shapes to your PDF documents securely in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
