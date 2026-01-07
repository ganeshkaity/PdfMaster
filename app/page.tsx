"use client";

import { motion } from "framer-motion";
import ToolCard from "./components/ui/ToolCard";
import {
  FileText, Scissors, Minimize2, Combine, RefreshCcw, Image, FileOutput,
  Lock, Shield, FileCog, Grid, Trash2, ArrowUpFromLine, Type, Key, Crop,
  FileCode, FileImage, Layers
} from "lucide-react";

const allTools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDFs into a single file. Order them however you like.",
    href: "/merge-pdf",
    icon: Combine
  },
  {
    title: "Split PDF",
    description: "Separate one page or a whole set for easy conversion.",
    href: "/split-pdf",
    icon: Scissors
  },
  {
    title: "Compress PDF",
    description: "Reduce file size while optimizing for maximal PDF quality.",
    href: "/compress-pdf",
    icon: Minimize2
  },
  {
    title: "Edit PDF",
    description: "Add text, shapes, and images to your PDF pages.",
    href: "/edit-pdf",
    icon: FileCog
  },
  {
    title: "Organize PDF",
    description: "Rearrange, add, or delete pages from your PDF.",
    href: "/organize-pdf",
    icon: Layers
  },
  {
    title: "Remove Pages",
    description: "Delete unwanted pages from your PDF file.",
    href: "/remove-pages",
    icon: Trash2
  },
  {
    title: "Reorder Pages",
    description: "Drag and drop to reorder PDF pages.",
    href: "/reorder-pdf",
    icon: ArrowUpFromLine
  },
  {
    title: "Rotate PDF",
    description: "Rotate your PDF pages. Select specific pages to fix orientation.",
    href: "/rotate-pdf",
    icon: RefreshCcw
  },
  {
    title: "Crop PDF",
    description: "Crop specific areas of your PDF pages to remove margins.",
    href: "/crop-pdf",
    icon: Crop
  },
  {
    title: "Protect PDF",
    description: "Encrypt your PDF with a password for security.",
    href: "/protect-pdf",
    icon: Lock
  },
  {
    title: "Add Watermark",
    description: "Stamp text or images over your PDF pages.",
    href: "/add-watermark",
    icon: Type
  },
  {
    title: "PDF to Word",
    description: "Convert PDFs to editable Word documents.",
    href: "/pdf-to-word",
    icon: FileText
  },
  {
    title: "Word to PDF",
    description: "Convert DOC and DOCX files to PDF.",
    href: "/word-to-pdf",
    icon: FileText
  },
  {
    title: "Excel to PDF",
    description: "Convert basic Excel spreadsheets to PDF.",
    href: "/excel-to-pdf",
    icon: Grid
  },
  {
    title: "PowerPoint to PDF",
    description: "Convert PPT presentations to PDF.",
    href: "/ppt-to-pdf",
    icon: FileOutput
  },
  {
    title: "PDF to PowerPoint",
    description: "Convert PDF content to PPT slides.",
    href: "/pdf-to-ppt",
    icon: FileOutput
  },
  {
    title: "HTML to PDF",
    description: "Convert Web pages or HTML code to PDF.",
    href: "/html-to-pdf",
    icon: FileCode
  },
  {
    title: "PDF to JPG",
    description: "Convert PDF pages to high-quality JPG images.",
    href: "/pdf-to-jpg",
    icon: Image
  },
  {
    title: "JPG to PDF",
    description: "Convert JPG images into a PDF document.",
    href: "/jpg-to-pdf",
    icon: Image
  },
  {
    title: "PDF to PNG",
    description: "Convert PDF pages to lossless PNG images.",
    href: "/pdf-to-png",
    icon: FileImage
  },
  {
    title: "PNG to PDF",
    description: "Convert PNG images into a PDF document.",
    href: "/png-to-pdf",
    icon: FileImage
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-slate-400">
              Every PDF Tool
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              You'll Ever Need.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            A powerful, secure, and beautiful suite of PDF utilities.
            <br className="hidden md:block" />
            100% free. No file limits. Client-side processing.
          </motion.p>
        </div>

        {/* Tools Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {allTools.map((tool) => (
            <motion.div key={tool.title} variants={item}>
              <ToolCard {...tool} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
