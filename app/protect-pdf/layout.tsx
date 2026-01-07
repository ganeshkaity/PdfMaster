import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Protect PDF Online Free – Allyono Apps",
    description: "Protect PDF documents online for free. Encrypt your PDF files with passwords securely. Client-side encryption.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
