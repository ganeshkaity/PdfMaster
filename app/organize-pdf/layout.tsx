import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Organize PDF Online Free – Allyono Apps",
    description: "Organize PDF pages online for free. Rearrange, delete, and sort PDF pages securely in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
