import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PNG to PDF Online Free – Allyono Apps",
    description: "Convert PNG images to PDF online for free. Merge PNG files into a PDF document securely in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
