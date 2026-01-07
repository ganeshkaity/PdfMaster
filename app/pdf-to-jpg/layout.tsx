import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF to JPG Online Free – Allyono Apps",
    description: "Convert PDF to JPG online for free. Extract images from PDF or convert pages to JPG format securely in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
