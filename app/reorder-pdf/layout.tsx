import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reorder PDF Online Free – Allyono Apps",
    description: "Reorder PDF pages online for free. Rearrange pages in your PDF document securely via drag and drop.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
