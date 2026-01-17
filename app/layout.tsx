import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free PDF Tools Online – Allyono Apps",
  description: "Allyono Apps - Free online PDF tools for editing, converting, compressing, and managing PDF files. All processing happens locally in your browser - secure, fast, and private.",
  other: {
    "google-adsense-account": "ca-pub-4661155459361916"
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PDFixr",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2236",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen relative selection:bg-cyan-500/30 selection:text-cyan-200`}>
        {/* Background Gradients */}
        <div className="fixed inset-0 -z-10 bg-[#0f172a]">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-20 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-pulse delay-2000"></div>
        </div>

        <Navbar />

        <main className="relative z-0">
          {children}
        </main>

        <Footer />

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }
          }}
        />
        <ServiceWorkerRegister />

      </body>
    </html>
  );
}
