import { Metadata } from "next";

export const metadata: Metadata = {
    title: "JPG to PDF Online Free – Allyono Apps",
    description: "Convert JPG images to PDF online for free. Combine multiple JPGs into a single PDF document securely.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
