import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us – Allyono Apps",
    description: "About Allyono Apps. Learn more about our mission to provide free, secure, and easy-to-use online PDF tools.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
