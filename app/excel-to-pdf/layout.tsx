import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Excel to PDF Online Free – Allyono Apps",
    description: "Convert Excel spreadsheets (XLSX) to PDF online for free. Accurately convert tables and data to PDF securely.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
