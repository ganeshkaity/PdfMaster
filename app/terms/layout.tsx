import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms & Conditions – Allyono Apps",
    description: "Terms and Conditions for Allyono Apps. Understand the rules and regulations for using our online PDF tools.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
