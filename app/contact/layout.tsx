import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us – Allyono Apps",
    description: "Contact Allyono Apps support. Get in touch with us for questions, feedback, or assistance with our PDF tools.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
