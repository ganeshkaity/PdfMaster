"use client";

import { useState, useRef, useEffect } from "react";
import ToolLayout from "../components/tools/ToolLayout";
import FileDropZone from "../components/tools/FileDropZone";
import {
    FileText, Wand2, Layout, Trash2, Download, Settings2, CheckCircle2,
    ChevronRight, Circle, ArrowLeft, MoreVertical, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { initPdfJs, renderPageToCanvas, applyFiltersToCanvas, FilterOptions, LogoRegion } from "../utils/class-notes-utils";
import { jsPDF } from "jspdf";
import PageSelector from "./components/PageSelector";
import InteractiveLogoRemover from "./components/InteractiveLogoRemover";
import StepsIndicator from "./components/StepsIndicator";
import ProcessingView from "./components/ProcessingView";
import SuccessView from "./components/SuccessView";
import PageEditModal, { CropRegion } from "./components/PageEditModal";

export default function ClassNotesPrintPage() {
    // Pipeline Steps: 0 = Upload, 1 = Select Pages, 2 = Configure/Preview
    const [step, setStep] = useState(0);

    const [files, setFiles] = useState<Array<{ file: File; pdfRef: any; pageCount: number }>>([]);
    const [pdfRef, setPdfRef] = useState<any>(null); // Keep for compatibility, but use files array
    const [numPages, setNumPages] = useState(0);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [pageOrder, setPageOrder] = useState<number[]>([]); // Custom page order from drag-and-drop
    const [pageToFileMap, setPageToFileMap] = useState<Record<number, number>>({}); // Maps global page number to file index
    const [isImageMode, setIsImageMode] = useState(false); // Track if uploaded file is an image
    // const [isProcessing, setIsProcessing] = useState(false); // Replaced by step 3
    const [originalFileSize, setOriginalFileSize] = useState(0);

    // Processing State
    const [progressState, setProgressState] = useState({
        percent: 0,
        current: 0,
        total: 0,
        estimatedTime: "~ calculating"
    });
    // const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Replaced by step 4
    const [successData, setSuccessData] = useState<{
        blob: Blob | null;
        formattedSize: string;
        pageCount: number;
    } | null>(null);

    // Enhancement / Filters
    const [filters, setFilters] = useState<FilterOptions>({
        invert: false,
        grayscale: false,
        removeBackground: false, // "Clear PDF Background"
        brightness: 100,
        contrast: 100,
        saturation: 100,
    });
    // Extra filter for "Black & White" (Pure thresholding, distinct from Grayscale)
    const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);

    // Layout Controls
    const [layout, setLayout] = useState({
        slidesPerRow: 1,
        slidesPerCol: 1,
        orientation: "portrait" as "portrait" | "landscape",
        pageSize: "a4",
        showSeparationLines: false, // "No" by default
        stretchSlides: false,
    });

    // Page Margins
    const [marginPreset, setMarginPreset] = useState<'none' | 'slim' | 'big' | 'custom'>('none');
    const [customMargins, setCustomMargins] = useState({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    });

    // Page Editing (Rotation)
    const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
    const [pageCrops, setPageCrops] = useState<Record<number, CropRegion>>({});
    const [pageEdits, setPageEdits] = useState<Record<number, string>>({}); // Store edited canvas as DataURL
    const [editingPage, setEditingPage] = useState<number | null>(null);

    // Logo Removal
    const [showLogoModal, setShowLogoModal] = useState(false);
    const [logoRegion, setLogoRegion] = useState<LogoRegion | undefined>(undefined);
    const [isLogoRemovalEnabled, setIsLogoRemovalEnabled] = useState(false);

    // Advanced Logo Removal Options
    const [logoFillType, setLogoFillType] = useState<'white' | 'black' | 'custom' | 'blur'>('white');
    const [logoFillColor, setLogoFillColor] = useState('#ffffff');
    const [logoBlurStrength, setLogoBlurStrength] = useState(5);

    // Output Quality
    const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra' | 'original'>('high');

    // Color Filters
    // Color Filters
    const [colorFilter, setColorFilter] = useState<'original' | 'auto-color' | 'light-text' | 'notes' | 'custom'>('original');

    // Preview
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [previewPage, setPreviewPage] = useState<number>(1); // Which page to preview in the main editor
    const [isExactPreview, setIsExactPreview] = useState(false); // Toggle for exact layout preview
    const [previewPageGroup, setPreviewPageGroup] = useState(0); // Index of page group to preview

    useEffect(() => {
        initPdfJs();
    }, []);

    // --- Helper Functions ---

    // Calculate page groups based on layout configuration
    const getPageGroups = () => {
        const pagesPerGroup = layout.slidesPerRow * layout.slidesPerCol;
        const groups = [];

        for (let i = 0; i < selectedPages.length; i += pagesPerGroup) {
            const groupPages = selectedPages.slice(i, i + pagesPerGroup);
            groups.push({
                start: groupPages[0],
                end: groupPages[groupPages.length - 1],
                pages: groupPages
            });
        }

        return groups;
    };

    // Get page dimensions based on size and orientation (in points)
    const getPageDimensions = (size: string, orientation: string) => {
        const sizes: Record<string, { width: number; height: number }> = {
            a4: { width: 595, height: 842 },
            letter: { width: 612, height: 792 }
        };

        let dim = sizes[size] || sizes.a4;

        if (orientation === 'landscape') {
            return { width: dim.height, height: dim.width };
        }

        return dim;
    };

    // Get margin values based on preset
    const getMargins = () => {
        const presets = {
            none: { top: 0, right: 0, bottom: 0, left: 0 },
            slim: { top: 10, right: 10, bottom: 10, left: 10 },
            big: { top: 30, right: 30, bottom: 30, left: 30 }
        };

        if (marginPreset === 'custom') {
            return customMargins;
        }

        return presets[marginPreset];
    };

    // Render a single page into a cell for grid layout
    const renderPageToCell = async (ctx: CanvasRenderingContext2D, pageNum: number, x: number, y: number, width: number, height: number) => {
        // Get file and local page number from pageToFileMap
        const fileIndex = pageToFileMap[pageNum];
        if (fileIndex === undefined) return;

        const fileData = files[fileIndex];
        if (!fileData) return;

        // Calculate local page number
        let localPageNum = pageNum;
        for (let j = 0; j < fileIndex; j++) {
            localPageNum -= files[j].pageCount;
        }

        // Get margins and apply to cell
        const margins = getMargins();
        const cellX = x + margins.left;
        const cellY = y + margins.top;
        const cellWidth = width - margins.left - margins.right;
        const cellHeight = height - margins.top - margins.bottom;

        // Render page with rotation
        const pageCanvas = await renderPageToCanvas(
            fileData.pdfRef,
            localPageNum,
            2.0, // Higher quality for preview
            pageRotations[pageNum] || 0
        );

        if (pageCanvas) {
            if (layout.stretchSlides) {
                // Stretch to fill cell (with margins)
                ctx.drawImage(pageCanvas, cellX, cellY, cellWidth, cellHeight);
            } else {
                // Maintain aspect ratio (with margins)
                const scale = Math.min(cellWidth / pageCanvas.width, cellHeight / pageCanvas.height);
                const scaledWidth = pageCanvas.width * scale;
                const scaledHeight = pageCanvas.height * scale;
                const offsetX = cellX + (cellWidth - scaledWidth) / 2;
                const offsetY = cellY + (cellHeight - scaledHeight) / 2;

                ctx.drawImage(pageCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
            }
        }
    };

    // Render exact preview with full layout
    const renderExactPreview = async () => {
        if (!previewCanvasRef.current || files.length === 0) return;

        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pageGroups = getPageGroups();
        if (pageGroups.length === 0) return;

        const currentGroup = pageGroups[previewPageGroup] || pageGroups[0];

        // Calculate dimensions
        const pageSize = getPageDimensions(layout.pageSize, layout.orientation);
        const rows = layout.slidesPerRow;  // Number of rows
        const cols = layout.slidesPerCol;  // Number of columns

        // Set canvas size (scale up for better quality)
        const scale = 1.5;
        canvas.width = pageSize.width * scale;
        canvas.height = pageSize.height * scale;
        ctx.scale(scale, scale);

        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, pageSize.width, pageSize.height);

        // Calculate cell dimensions
        const cellWidth = pageSize.width / cols;
        const cellHeight = pageSize.height / rows;

        // Render each page in the group
        for (let i = 0; i < currentGroup.pages.length; i++) {
            const pageNum = currentGroup.pages[i];
            const row = Math.floor(i / cols);
            const col = i % cols;

            const x = col * cellWidth;
            const y = row * cellHeight;

            // Render page into cell
            await renderPageToCell(ctx, pageNum, x, y, cellWidth, cellHeight);
        }

        // Draw separation lines
        if (layout.showSeparationLines) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;

            // Vertical lines
            for (let i = 1; i < cols; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellWidth, 0);
                ctx.lineTo(i * cellWidth, pageSize.height);
                ctx.stroke();
            }

            // Horizontal lines
            for (let i = 1; i < rows; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * cellHeight);
                ctx.lineTo(pageSize.width, i * cellHeight);
                ctx.stroke();
            }
        }
    };

    // Render single page preview
    const renderSinglePagePreview = async () => {
        if (!previewCanvasRef.current || files.length === 0) return;

        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get file for the preview page
        const fileIndex = pageToFileMap[previewPage];
        if (fileIndex === undefined) return;

        const fileData = files[fileIndex];
        if (!fileData) return;

        // Calculate local page number
        let localPageNum = previewPage;
        for (let j = 0; j < fileIndex; j++) {
            localPageNum -= files[j].pageCount;
        }

        // Render page
        const pageCanvas = await renderPageToCanvas(
            fileData.pdfRef,
            localPageNum,
            2.0,
            pageRotations[previewPage] || 0
        );

        if (pageCanvas) {
            canvas.width = pageCanvas.width;
            canvas.height = pageCanvas.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(pageCanvas, 0, 0);
        }
    };

    // useEffect to render preview when settings change
    useEffect(() => {
        if (step !== 2 || selectedPages.length === 0) return;

        if (isExactPreview) {
            renderExactPreview();
        } else {
            renderSinglePagePreview();
        }
    }, [step, isExactPreview, previewPageGroup, previewPage, layout, selectedPages, pageRotations, files]);

    // --- Handlers ---

    const handleFileSelected = async (newFiles: File[]) => {
        if (newFiles.length === 0) return;

        const totalOriginalSize = newFiles.reduce((sum, f) => sum + f.size, 0);
        setOriginalFileSize(prev => prev + totalOriginalSize);

        try {
            const loadedFiles = await Promise.all(newFiles.map(async (selectedFile) => {
                // Check if it's an image
                const isImage = selectedFile.type.startsWith('image/');

                if (isImage) {
                    setIsImageMode(true);

                    // Load image and create a virtual "PDF" structure
                    const img = new Image();
                    const imgUrl = URL.createObjectURL(selectedFile);

                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => {
                            URL.revokeObjectURL(imgUrl);
                            resolve();
                        };
                        img.onerror = () => {
                            URL.revokeObjectURL(imgUrl);
                            reject(new Error('Failed to load image'));
                        };
                        img.src = imgUrl;
                    });

                    // Create a mock PDF structure for images
                    const mockPdf = {
                        numPages: 1,
                        getPage: async (pageNum: number) => ({
                            getViewport: ({ scale, rotation = 0 }: any) => ({
                                width: img.width * scale,
                                height: img.height * scale,
                                rotation
                            }),
                            render: ({ canvasContext, viewport }: any) => ({
                                promise: new Promise<void>((res) => {
                                    canvasContext.save();

                                    if (viewport.rotation) {
                                        const centerX = viewport.width / 2;
                                        const centerY = viewport.height / 2;
                                        canvasContext.translate(centerX, centerY);
                                        canvasContext.rotate((viewport.rotation * Math.PI) / 180);
                                        canvasContext.translate(-centerX, -centerY);
                                    }

                                    canvasContext.drawImage(img, 0, 0, viewport.width, viewport.height);
                                    canvasContext.restore();
                                    res();
                                })
                            })
                        }),
                        _imageElement: img
                    };

                    return { file: selectedFile, pdfRef: mockPdf, pageCount: 1 };
                } else {
                    // Handle PDF upload
                    const pdfjs = await import("pdfjs-dist");
                    const buffer = await selectedFile.arrayBuffer();
                    const pdf = await pdfjs.getDocument(buffer).promise;
                    return { file: selectedFile, pdfRef: pdf, pageCount: pdf.numPages };
                }
            }));

            // Merge with existing files
            const updatedFiles = [...files, ...loadedFiles];
            setFiles(updatedFiles);

            // Calculate total pages and create mapping
            let globalPageNum = 1;
            const newPageToFileMap: Record<number, number> = {};
            const allPages: number[] = [];

            updatedFiles.forEach((fileData, fileIndex) => {
                for (let i = 0; i < fileData.pageCount; i++) {
                    newPageToFileMap[globalPageNum] = fileIndex;
                    allPages.push(globalPageNum);
                    globalPageNum++;
                }
            });

            setPageToFileMap(newPageToFileMap);
            setNumPages(globalPageNum - 1);
            setSelectedPages(allPages);
            setPageOrder(allPages); // Initialize page order

            // Set first file's ref as primary for compatibility
            if (updatedFiles.length > 0) {
                setPdfRef(updatedFiles[0].pdfRef);
            }

            setStep(1);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load file(s).");
        }
    };

    const handlePageSelectionNext = () => {
        if (selectedPages.length === 0) {
            toast.error("Please select at least one page.");
            return;
        }
        setPreviewPage(selectedPages[0]); // Default preview to first selected
        setStep(2); // Move to Configure
    };

    const handlePageEdit = (pageNum: number) => {
        setEditingPage(pageNum);
    };

    const handleEditApply = (rotation: number, crop?: CropRegion, editedImage?: string) => {
        if (editingPage === null) return;
        setPageRotations(prev => ({ ...prev, [editingPage]: rotation }));
        if (crop) {
            setPageCrops(prev => ({ ...prev, [editingPage]: crop }));
        } else {
            // Remove crop if user reset it
            const newCrops = { ...pageCrops };
            delete newCrops[editingPage];
            setPageCrops(newCrops);
        }

        if (editedImage) {
            setPageEdits(prev => ({ ...prev, [editingPage]: editedImage }));
        }

        setEditingPage(null);
    };

    const onProcessAnother = () => {
        setStep(0);
        setFiles([]);
        setPdfRef(null);
        setNumPages(0);
        setSelectedPages([]);
        setPageOrder([]);
        setPageToFileMap({});
        setOriginalFileSize(0);
        setProgressState({
            percent: 0,
            current: 0,
            total: 0,
            estimatedTime: "~ calculating"
        });
        setSuccessData(null);
        setFilters({
            invert: false,
            grayscale: false,
            removeBackground: false,
            brightness: 100,
            contrast: 100,
            saturation: 100, // Reset saturation
        });
        setIsBlackAndWhite(false);
        setLayout({
            slidesPerRow: 1,
            slidesPerCol: 1,
            orientation: "portrait",
            pageSize: "a4",
            showSeparationLines: false,
            stretchSlides: false,
        });
        setShowLogoModal(false);
        setLogoRegion(undefined);
        setIsLogoRemovalEnabled(false);
        setLogoFillType('white');
        setLogoFillColor('#ffffff');
        setLogoBlurStrength(5);
        setQuality('high');
        setColorFilter('original');
        setPreviewPage(1);
        setPageRotations({});
        setPageCrops({});
        setEditingPage(null);
        setIsImageMode(false);
    };



    // --- Preview Logic ---
    const renderLivePreview = async () => {
        if (!files.length || !previewCanvasRef.current || !selectedPages.includes(previewPage)) return;

        // Find which file this page belongs to
        const fileIndex = pageToFileMap[previewPage];
        if (fileIndex === undefined) return;

        const fileData = files[fileIndex];

        // Calculate local page number within the file
        let localPageNum = previewPage;
        for (let i = 0; i < fileIndex; i++) {
            localPageNum -= files[i].pageCount;
        }

        // Render base page
        // Render base page or use edited image
        const rotation = pageRotations[previewPage] || 0;
        const crop = pageCrops[previewPage];
        const editedImgData = pageEdits[previewPage];

        let canvas: HTMLCanvasElement | null = null;

        if (editedImgData) {
            // Use edited image (already rotated)
            const img = new Image();
            img.src = editedImgData;
            await new Promise((resolve) => { img.onload = resolve; });

            const baseCanvas = document.createElement('canvas');
            baseCanvas.width = img.width;
            baseCanvas.height = img.height;
            const baseCtx = baseCanvas.getContext('2d');
            baseCtx?.drawImage(img, 0, 0);

            if (crop) {
                // Apply crop to edited image
                const croppedCanvas = document.createElement('canvas');
                const cw = (crop.width / 100) * baseCanvas.width;
                const ch = (crop.height / 100) * baseCanvas.height;
                const cx = (crop.x / 100) * baseCanvas.width;
                const cy = (crop.y / 100) * baseCanvas.height;

                croppedCanvas.width = cw;
                croppedCanvas.height = ch;
                const croppedCtx = croppedCanvas.getContext('2d');
                croppedCtx?.drawImage(baseCanvas, cx, cy, cw, ch, 0, 0, cw, ch);
                canvas = croppedCanvas;
            } else {
                canvas = baseCanvas;
            }
        } else {
            // Standard render from PDF
            canvas = await renderPageToCanvas(fileData.pdfRef, localPageNum, 0.8, rotation, crop);
        }
        if (!canvas || !previewCanvasRef.current) return;

        const ctx = previewCanvasRef.current.getContext('2d');
        if (!ctx) return;

        previewCanvasRef.current.width = canvas.width;
        previewCanvasRef.current.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);

        // Apply filters
        const activeFilters = { ...filters };

        // Apply Color Filter Presets
        switch (colorFilter) {
            case 'auto-color': activeFilters.contrast = 115; activeFilters.brightness = 110; activeFilters.saturation = 100; break;
            case 'light-text': activeFilters.contrast = 130; activeFilters.brightness = 125; activeFilters.saturation = 90; break;
            case 'notes': activeFilters.saturation = 57; activeFilters.contrast = 147; activeFilters.brightness = 116; break;
            case 'custom': /* Use sliders */ break;
            case 'original': default: activeFilters.contrast = 100; activeFilters.brightness = 100; activeFilters.saturation = 100; break;
        }

        if (isBlackAndWhite) {
            activeFilters.grayscale = true;
            activeFilters.contrast = 150;
        }

        const logoOpts = {
            enabled: isLogoRemovalEnabled,
            region: logoRegion,
            fillType: logoFillType,
            fillColor: logoFillColor,
            blurStrength: logoBlurStrength
        };

        applyFiltersToCanvas(previewCanvasRef.current, activeFilters, logoOpts);
    };

    useEffect(() => {
        if (step === 2) {
            renderLivePreview();
        }
    }, [step, filters, isBlackAndWhite, logoRegion, isLogoRemovalEnabled, previewPage, logoFillType, logoFillColor, logoBlurStrength, colorFilter, pageEdits, pageCrops, pageRotations]);


    // --- Output Generation ---
    const handleProcess = async () => {
        if (!pdfRef || selectedPages.length === 0) return;

        setStep(3); // Go to Processing Step
        const startTime = Date.now();
        const total = selectedPages.length;

        setProgressState({
            percent: 0,
            current: 0,
            total,
            estimatedTime: "~ calculating..."
        });

        try {
            // Orientation switching
            const orient = layout.orientation === 'portrait' ? 'p' : 'l';
            const doc = new jsPDF({
                orientation: orient,
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Get margins from user selection
            const margins = getMargins();
            // Convert pixels to mm (rough approximation: 1px ≈ 0.264583mm)
            const marginTop = margins.top * 0.264583;
            const marginRight = margins.right * 0.264583;
            const marginBottom = margins.bottom * 0.264583;
            const marginLeft = margins.left * 0.264583;

            // Grid logic
            const numRows = layout.slidesPerRow;
            const numCols = layout.slidesPerCol;

            const cellWidth = (pageWidth - marginLeft - marginRight) / numCols;
            const cellHeight = (pageHeight - marginTop - marginBottom) / numRows;

            let currentSlot = 0;
            const slotsPerPage = numRows * numCols;
            const activeFilters = { ...filters };

            // Apply Color Filter Presets
            switch (colorFilter) {
                case 'auto-color': activeFilters.contrast = 115; activeFilters.brightness = 110; activeFilters.saturation = 100; break;
                case 'light-text': activeFilters.contrast = 130; activeFilters.brightness = 125; activeFilters.saturation = 90; break;
                case 'notes': activeFilters.saturation = 57; activeFilters.contrast = 147; activeFilters.brightness = 116; break;
                case 'custom': /* Use sliders */ break;
                case 'original': default: activeFilters.contrast = 100; activeFilters.brightness = 100; activeFilters.saturation = 100; break;
            }

            if (isBlackAndWhite) {
                activeFilters.grayscale = true;
                activeFilters.contrast = 150;
            }

            for (let i = 0; i < selectedPages.length; i++) {
                // Use pageOrder if available, otherwise fall back to selectedPages
                const orderedPages = pageOrder.length > 0
                    ? pageOrder.filter(p => selectedPages.includes(p))
                    : selectedPages;

                const globalPageNum = orderedPages[i];
                const fileIndex = pageToFileMap[globalPageNum];
                if (fileIndex === undefined) continue;

                const fileData = files[fileIndex];

                // Calculate local page number
                let localPageNum = globalPageNum;
                for (let j = 0; j < fileIndex; j++) {
                    localPageNum -= files[j].pageCount;
                }

                // Update Progress
                const elapsed = Date.now() - startTime;
                const avgTimePerItem = elapsed / (i + 1);
                const remainingItems = total - (i + 1);
                const remainingSecs = Math.ceil((avgTimePerItem * remainingItems) / 1000);

                setProgressState({
                    percent: Math.round(((i + 1) / total) * 100),
                    current: i + 1,
                    total,
                    estimatedTime: i === 0 ? "calculating..." : `~${remainingSecs}s remaining`
                });

                // Yield to main thread to allow UI update
                await new Promise(resolve => setTimeout(resolve, 0));

                const getScale = () => {
                    switch (quality) {
                        case 'low': return 1.0;
                        case 'medium': return 1.5;
                        case 'high': return 2.0;
                        case 'ultra': return 3.0;
                        case 'original': return 1.5; // Default assumption for original if specific vector scale not applicable, or match 'medium'.
                        default: return 2.0;
                    }
                };
                const rotation = pageRotations[globalPageNum] || 0;
                const crop = pageCrops[globalPageNum];
                const editedImgData = pageEdits[globalPageNum];

                let canvas: HTMLCanvasElement | null = null;

                if (editedImgData) {
                    // Use edited image
                    const img = new Image();
                    img.src = editedImgData;
                    await new Promise((resolve) => { img.onload = resolve; });

                    const baseCanvas = document.createElement('canvas');
                    baseCanvas.width = img.width;
                    baseCanvas.height = img.height;
                    const baseCtx = baseCanvas.getContext('2d');
                    baseCtx?.drawImage(img, 0, 0);

                    if (crop) {
                        const croppedCanvas = document.createElement('canvas');
                        const cw = (crop.width / 100) * baseCanvas.width;
                        const ch = (crop.height / 100) * baseCanvas.height;
                        const cx = (crop.x / 100) * baseCanvas.width;
                        const cy = (crop.y / 100) * baseCanvas.height;

                        croppedCanvas.width = cw;
                        croppedCanvas.height = ch;
                        const croppedCtx = croppedCanvas.getContext('2d');
                        croppedCtx?.drawImage(baseCanvas, cx, cy, cw, ch, 0, 0, cw, ch);
                        canvas = croppedCanvas;
                    } else {
                        canvas = baseCanvas;
                    }
                } else {
                    canvas = await renderPageToCanvas(fileData.pdfRef, localPageNum, getScale(), rotation, crop);
                }

                if (!canvas) continue;

                // Apply logic
                const logoOpts = {
                    enabled: isLogoRemovalEnabled,
                    region: logoRegion,
                    fillType: logoFillType,
                    fillColor: logoFillColor,
                    blurStrength: logoBlurStrength
                };
                applyFiltersToCanvas(canvas, activeFilters, logoOpts);

                const imgData = canvas.toDataURL('image/jpeg', 0.85);

                // Slot calculation
                const slotInPage = currentSlot % slotsPerPage;
                const rowIndex = Math.floor(slotInPage / numCols);
                const colIndex = slotInPage % numCols;

                const x = marginLeft + (colIndex * cellWidth);
                const y = marginTop + (rowIndex * cellHeight);

                // Fit Logic
                const imgRatio = canvas.width / canvas.height;
                const cellRatio = cellWidth / cellHeight;
                let finalW = cellWidth;
                let finalH = cellHeight;

                if (!layout.stretchSlides) {
                    if (imgRatio > cellRatio) {
                        finalH = finalW / imgRatio;
                    } else {
                        finalW = finalH * imgRatio;
                    }
                }

                // Center in cell
                const offX = (cellWidth - finalW) / 2;
                const offY = (cellHeight - finalH) / 2;

                doc.addImage(imgData, 'JPEG', x + offX, y + offY, finalW, finalH);

                if (layout.showSeparationLines) {
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(x, y, cellWidth, cellHeight);
                }

                currentSlot++;

                if (currentSlot % slotsPerPage === 0 && i < selectedPages.length - 1) {
                    doc.addPage();
                }
            }

            // Finish processing
            const blob = doc.output('blob');
            const finalSize = formatBytes(blob.size);
            const totalPagesGenerated = doc.getNumberOfPages();

            setSuccessData({
                blob: blob,
                formattedSize: finalSize,
                pageCount: totalPagesGenerated
            });

            setStep(4); // Go to Success Step

        } catch (e) {
            console.error(e);
            toast.error("Error creating PDF");
            setStep(2); // Go back to config on error
        }
    };


    return (
        <ToolLayout
            title="Class Notes Print"
            description="Format lecture slides for printing. Invert colors, remove black backgrounds, and print multiple slides per page."
            icon={<FileText className="w-10 h-10 text-purple-400" />}
        >
            <StepsIndicator
                currentStep={step}
                steps={["Upload PDF", "Select Pages", "Customize", "Processing", "Download"]}
            />
            {/* Step 0: Upload */}
            {step === 0 && (
                <div className="max-w-3xl mx-auto space-y-8">
                    <FileDropZone
                        onFilesSelected={handleFileSelected}
                        accept={{
                            "application/pdf": [".pdf"],
                            "image/*": [".jpg", ".jpeg", ".png", ".webp"]
                        }}
                        maxFiles={999}
                        title="Select PDF or Images"
                        className="h-80 border-purple-500/20 hover:border-purple-500/50"
                    />
                </div>
            )}

            {/* Step 1: Page Selection */}
            {step === 1 && (
                <PageSelector
                    files={files}
                    totalPages={numPages}
                    pageToFileMap={pageToFileMap}
                    selectedPages={selectedPages}
                    onSelectionChange={setSelectedPages}
                    onPageOrderChange={setPageOrder}
                    onNext={handlePageSelectionNext}
                    onBack={() => setStep(0)}
                    onEdit={handlePageEdit}
                    pageRotations={pageRotations}
                    pageCrops={pageCrops}
                    pageEdits={pageEdits}
                    onAddMore={handleFileSelected}
                />
            )}

            {/* Step 2: Main Configuration */}
            {step === 2 && (
                <div className="space-y-4">

                    {/* Top Section: Controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Column 1: Enhancement & Logo */}
                        <div className="space-y-3">

                            {/* Enhancement Panel */}
                            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4 space-y-4 h-full mt-4 lg:mt-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                        <Wand2 className="w-5 h-5 text-purple-400" /> Enhancement
                                    </h3>

                                    <div className="space-y-3">
                                        {/* Invert */}
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-medium text-slate-200">Invert Colors</p>
                                                <p className="text-xs text-slate-500">Dark to light</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={filters.invert}
                                                onChange={(e) => setFilters({ ...filters, invert: e.target.checked })}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                        {/* Clear BG */}
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-medium text-slate-200">Clear PDF Background</p>
                                                <p className="text-xs text-slate-500">Remove background noise</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={filters.removeBackground}
                                                onChange={(e) => setFilters({ ...filters, removeBackground: e.target.checked })}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                        {/* Grayscale */}
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-medium text-slate-200">Grayscale</p>
                                                <p className="text-xs text-slate-500">Shades of gray</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={filters.grayscale}
                                                onChange={(e) => setFilters({ ...filters, grayscale: e.target.checked })}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                        {/* B&W */}
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-medium text-slate-200">Black & White</p>
                                                <p className="text-xs text-slate-500">Pure black & white</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isBlackAndWhite}
                                                onChange={(e) => setIsBlackAndWhite(e.target.checked)}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* Remove Logo Section merged in */}
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                        <Trash2 className="w-5 h-5 text-purple-400" /> Remove Logo
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                            <span className="font-medium text-slate-200">Enable Logo Removal</span>
                                            <input
                                                type="checkbox"
                                                checked={isLogoRemovalEnabled}
                                                onChange={(e) => {
                                                    setIsLogoRemovalEnabled(e.target.checked);
                                                    if (e.target.checked && !logoRegion) setShowLogoModal(true);
                                                }}
                                                className="w-10 h-6 rounded-full appearance-none bg-slate-700 checked:bg-purple-500 transition relative after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:translate-x-4 cursor-pointer"
                                            />
                                        </div>

                                        {/* Advanced Fill Options */}
                                        {isLogoRemovalEnabled && (
                                            <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-2">Fill Method</label>
                                                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                                                        {(['white', 'black', 'custom', 'blur'] as const).map((type) => (
                                                            <button
                                                                key={type}
                                                                onClick={() => setLogoFillType(type)}
                                                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${logoFillType === type ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                                            >
                                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Custom Color Input */}
                                                {logoFillType === 'custom' && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-slate-300">Fill Color</span>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={logoFillColor}
                                                                onChange={(e) => setLogoFillColor(e.target.value)}
                                                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                                            />
                                                            <span className="text-xs text-slate-500 font-mono">{logoFillColor}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Blur Strength Slider */}
                                                {logoFillType === 'blur' && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm text-slate-300">Blur Strength</span>
                                                            <span className="text-xs text-purple-400 font-mono">{logoBlurStrength}px</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="20"
                                                            step="1"
                                                            value={logoBlurStrength}
                                                            onChange={(e) => setLogoBlurStrength(Number(e.target.value))}
                                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                                        />
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setShowLogoModal(true)}
                                                    className="w-full py-2 bg-slate-800 text-purple-400 text-sm font-medium rounded-lg border border-purple-500/20 hover:bg-slate-700 transition"
                                                >
                                                    Adjust Logo Region
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* Output Quality */}
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                        <Settings2 className="w-5 h-5 text-purple-400" /> Output Quality
                                    </h3>
                                    <div className="bg-slate-950/50 rounded-xl border border-white/5 p-4">
                                        <div className="grid grid-cols-5 gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                                            {(['low', 'medium', 'high', 'ultra', 'original'] as const).map((q) => (
                                                <button
                                                    key={q}
                                                    onClick={() => setQuality(q)}
                                                    className={`py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition capitalize ${quality === q ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 text-center">
                                            {quality === 'low' && 'Fastest, lower resolution (1.0x)'}
                                            {quality === 'medium' && 'Balanced speed & quality (1.5x)'}
                                            {quality === 'high' && 'Recommended for printing (2.0x)'}
                                            {quality === 'ultra' && 'Maximum detail, slower processing (3.0x)'}
                                            {quality === 'original' && 'Standard rendering (1.5x)'}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-white/10" />

                                {/* Color Filters */}
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                        <Wand2 className="w-5 h-5 text-purple-400" /> Color Filters
                                    </h3>
                                    <div className="bg-slate-950/50 rounded-xl border border-white/5 p-4">
                                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-x-auto custom-scrollbar">
                                            {(['original', 'auto-color', 'light-text', 'notes', 'custom'] as const).map((f) => (
                                                <button
                                                    key={f}
                                                    onClick={() => setColorFilter(f)}
                                                    className={`flex-1 min-w-[70px] py-2 px-1 text-[10px] sm:text-xs font-medium rounded-md transition capitalize whitespace-nowrap ${colorFilter === f ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    {f.replace('-', ' ')}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Custom Sliders */}
                                        {colorFilter === 'custom' && (
                                            <div className="mt-4 space-y-3 pt-3 border-t border-white/5">
                                                {/* Saturation */}
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-400">Saturation</span>
                                                        <span className="text-purple-400 font-mono">{filters.saturation}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="200"
                                                        value={filters.saturation}
                                                        onChange={(e) => setFilters(prev => ({ ...prev, saturation: Number(e.target.value) }))}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                                    />
                                                </div>
                                                {/* Contrast */}
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-400">Contrast</span>
                                                        <span className="text-purple-400 font-mono">{filters.contrast}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="200"
                                                        value={filters.contrast}
                                                        onChange={(e) => setFilters(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                                    />
                                                </div>
                                                {/* Brightness */}
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-400">Brightness</span>
                                                        <span className="text-purple-400 font-mono">{filters.brightness}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="200"
                                                        value={filters.brightness}
                                                        onChange={(e) => setFilters(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Column 2: Layout Controls */}
                        <div className="space-y-3">
                            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4 space-y-4 h-full">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-purple-400" /> Layout
                                </h3>

                                {/* Visual Layout Preview */}
                                <div className="bg-slate-950/50 rounded-xl p-4 flex items-center justify-center gap-6 border border-white/5">
                                    {/* Page Representation */}
                                    <div
                                        className="border-2 border-slate-700 bg-slate-900 shadow-xl relative transition-all duration-300 flex-shrink-0"
                                        style={{
                                            width: layout.orientation === 'portrait' ? '120px' : '170px',
                                            height: layout.orientation === 'portrait' ? '170px' : '120px',
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(${layout.slidesPerCol}, 1fr)`,
                                            gridTemplateRows: `repeat(${layout.slidesPerRow}, 1fr)`,
                                            padding: '6px',
                                            gap: '4px'
                                        }}
                                    >
                                        {Array.from({ length: layout.slidesPerRow * layout.slidesPerCol }).map((_, i) => (
                                            <div key={i} className="border border-purple-500/50 bg-purple-500/10 rounded-[2px]" />
                                        ))}
                                    </div>

                                    {/* Text Info */}
                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-cyan-400 mb-1">
                                            {layout.slidesPerRow * layout.slidesPerCol}
                                        </div>
                                        <div className="text-sm text-slate-300 font-medium">
                                            {layout.slidesPerRow} × {layout.slidesPerCol} slides
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                                            per page
                                        </div>
                                    </div>
                                </div>

                                {/* Document Size */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Document Size</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.pageSize === 'original' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, pageSize: 'original' })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.pageSize === 'original' ? 'fill-current' : ''}`} />
                                            Original
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.pageSize === 'a4' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, pageSize: 'a4' })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.pageSize === 'a4' ? 'fill-current' : ''}`} />
                                            A4
                                        </button>
                                    </div>
                                </div>

                                {/* Orientation */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Orientation</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.orientation === 'portrait' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, orientation: 'portrait' })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.orientation === 'portrait' ? 'fill-current' : ''}`} />
                                            Portrait
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.orientation === 'landscape' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, orientation: 'landscape' })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.orientation === 'landscape' ? 'fill-current' : ''}`} />
                                            Landscape
                                        </button>
                                    </div>
                                </div>

                                {/* Slides Per Page (Rows / Cols) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Slides per Page</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-xs text-slate-500 mb-1 block">Rows</span>
                                            <select
                                                value={layout.slidesPerRow}
                                                onChange={(e) => setLayout({ ...layout, slidesPerRow: Number(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 mb-1 block">Columns</span>
                                            <select
                                                value={layout.slidesPerCol}
                                                onChange={(e) => setLayout({ ...layout, slidesPerCol: Number(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Separation Lines */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Add Separation Lines</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${!layout.showSeparationLines ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, showSeparationLines: false })}
                                        >
                                            <Circle className={`w-4 h-4 ${!layout.showSeparationLines ? 'fill-current' : ''}`} />
                                            No
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.showSeparationLines ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, showSeparationLines: true })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.showSeparationLines ? 'fill-current' : ''}`} />
                                            Yes
                                        </button>
                                    </div>
                                </div>

                                {/* Stretch Slides */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Stretch Slides</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${!layout.stretchSlides ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, stretchSlides: false })}
                                        >
                                            <Circle className={`w-4 h-4 ${!layout.stretchSlides ? 'fill-current' : ''}`} />
                                            No
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${layout.stretchSlides ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setLayout({ ...layout, stretchSlides: true })}
                                        >
                                            <Circle className={`w-4 h-4 ${layout.stretchSlides ? 'fill-current' : ''}`} />
                                            Yes
                                        </button>
                                    </div>
                                </div>

                                {/* Page Margins */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Page Margins</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition ${marginPreset === 'none' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setMarginPreset('none')}
                                        >
                                            <Circle className={`w-3 h-3 ${marginPreset === 'none' ? 'fill-current' : ''}`} />
                                            None
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition ${marginPreset === 'slim' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setMarginPreset('slim')}
                                        >
                                            <Circle className={`w-3 h-3 ${marginPreset === 'slim' ? 'fill-current' : ''}`} />
                                            Slim
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition ${marginPreset === 'big' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setMarginPreset('big')}
                                        >
                                            <Circle className={`w-3 h-3 ${marginPreset === 'big' ? 'fill-current' : ''}`} />
                                            Big
                                        </button>
                                        <button
                                            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition ${marginPreset === 'custom' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            onClick={() => setMarginPreset('custom')}
                                        >
                                            <Circle className={`w-3 h-3 ${marginPreset === 'custom' ? 'fill-current' : ''}`} />
                                            Custom
                                        </button>
                                    </div>

                                    {/* Custom Margin Inputs */}
                                    {marginPreset === 'custom' && (
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">Top (px)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={customMargins.top}
                                                    onChange={(e) => setCustomMargins({ ...customMargins, top: Number(e.target.value) })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">Right (px)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={customMargins.right}
                                                    onChange={(e) => setCustomMargins({ ...customMargins, right: Number(e.target.value) })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">Bottom (px)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={customMargins.bottom}
                                                    onChange={(e) => setCustomMargins({ ...customMargins, bottom: Number(e.target.value) })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">Left (px)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={customMargins.left}
                                                    onChange={(e) => setCustomMargins({ ...customMargins, left: Number(e.target.value) })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>


                    {/* Bottom Section: Preview & Actions - Full Width */}
                    <div className="space-y-3 border-t border-white/10 pt-4">

                        <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4 min-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-purple-400" /> Layout Preview
                                </h3>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {/* Exact Preview Toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isExactPreview}
                                            onChange={(e) => {
                                                setIsExactPreview(e.target.checked);
                                                setPreviewPageGroup(0); // Reset to first group
                                            }}
                                            className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition">Exact Preview</span>
                                    </label>

                                    {/* Page/Group Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-400">Previewing:</span>
                                        {isExactPreview ? (
                                            <select
                                                value={previewPageGroup}
                                                onChange={(e) => setPreviewPageGroup(Number(e.target.value))}
                                                className="bg-slate-950 text-sm border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:border-purple-500 outline-none"
                                            >
                                                {getPageGroups().map((group, idx) => (
                                                    <option key={idx} value={idx}>
                                                        Page {group.start}{group.end !== group.start ? `-${group.end}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select
                                                value={previewPage}
                                                onChange={(e) => setPreviewPage(Number(e.target.value))}
                                                className="bg-slate-950 text-sm border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:border-purple-500 outline-none"
                                            >
                                                {selectedPages.map(p => (
                                                    <option key={p} value={p}>Page {p}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-950 rounded-xl border border-white/10 relative flex items-center justify-center p-8 overflow-hidden min-h-[400px]">
                                <canvas
                                    ref={previewCanvasRef}
                                    className="max-w-full max-h-[600px] object-contain shadow-2xl border border-slate-800"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-4 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleProcess}
                                className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-lg shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                <Settings2 className="w-5 h-5" /> Process File
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {/* Step 3: Processing */}
            {step === 3 && (
                <ProcessingView
                    progress={progressState.percent}
                    currentStep="Optimizing your notes..."
                    subText={`Processing page ${progressState.current} of ${progressState.total}`}
                    processedPages={progressState.current}
                    totalPages={progressState.total}
                    estimatedTimeRemaining={progressState.estimatedTime}
                />
            )}

            {/* Step 4: Success */}
            {step === 4 && (
                <SuccessView
                    fileName={files.length > 0 ? files[0].file.name.replace(/\.(pdf|jpe?g|png|webp)$/i, '_enhanced.pdf') : 'document_enhanced.pdf'}
                    originalSize={formatBytes(originalFileSize || 0)}
                    finalSize={successData?.formattedSize || "0 MB"}
                    pageCount={successData?.pageCount || 0}
                    onDownload={(customFileName) => {
                        if (successData?.blob) {
                            const url = URL.createObjectURL(successData.blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = customFileName || (files.length > 0 ? files[0].file.name.replace(/\.(pdf|jpe?g|png|webp)$/i, '_class_notes.pdf') : "class-notes.pdf");
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }
                    }}
                    onPreview={() => {
                        if (successData?.blob) {
                            const url = URL.createObjectURL(successData.blob);
                            window.open(url, '_blank');
                        }
                    }}
                    onProcessAnother={() => {
                        setStep(0);
                        setFiles([]);
                        setPdfRef(null);
                        setSelectedPages([]);
                        setIsLogoRemovalEnabled(false);
                        setLogoRegion(undefined);
                        setLogoBlurStrength(5);
                        setLayout({
                            pageSize: 'a4',
                            orientation: 'portrait',
                            slidesPerRow: 1, // Reset to default 1
                            slidesPerCol: 1, // Reset to default 3
                            showSeparationLines: true,
                            stretchSlides: false
                        });
                        setProgressState({ percent: 0, total: 0, current: 0, estimatedTime: 'N/A' });
                        setSuccessData(null);
                        setOriginalFileSize(0);
                        setQuality('high');
                        setColorFilter('original');
                        setPageRotations({}); // Reset page rotations
                        setPageCrops({}); // Reset page crops
                    }}
                />
            )}

            {/* Logo Removal Modal */}
            <InteractiveLogoRemover
                pdf={pdfRef}
                isOpen={showLogoModal}
                onClose={() => setShowLogoModal(false)}
                initialRegion={logoRegion}
                onApply={(region) => {
                    setLogoRegion(region);
                    setShowLogoModal(false);
                }}
            />

            {/* Page Edit Modal */}
            {editingPage !== null && (
                <PageEditModal
                    pdf={pdfRef}
                    pageNumber={editingPage}
                    initialRotation={pageRotations[editingPage] || 0}
                    initialCrop={pageCrops[editingPage]}
                    isOpen={true}
                    onClose={() => setEditingPage(null)}
                    onApply={handleEditApply}
                />
            )}

        </ToolLayout>
    );
}

// Helper for file size formatting
function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
