import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF to Word Online Free – Allyono Apps",
    description: "Convert PDF to Word online for free. Extract text from PDF files into editable DOCX format securely in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
