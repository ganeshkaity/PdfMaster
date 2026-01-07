import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Crop PDF Online Free – Allyono Apps",
    description: "Crop PDF pages online for free. Trim margins and adjust visible area of PDF pages securely in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
