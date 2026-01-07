import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy – Allyono Apps",
    description: "Privacy Policy for Allyono Apps. Read how we handle your data and ensure your privacy while using our PDF tools.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
