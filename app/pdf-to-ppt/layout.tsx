import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF to PPT Online Free – Allyono Apps",
    description: "Convert PDF to PowerPoint online for free. Extract slides from PDF to PPT presentation securely.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
