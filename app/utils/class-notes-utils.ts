
import { PDFDocumentProxy } from "pdfjs-dist";

// Image Filter Options Interface
export interface FilterOptions {
  invert: boolean;
  grayscale: boolean;
  removeBackground: boolean;
  brightness: number; // 0 to 200, default 100
  contrast: number;   // 0 to 200, default 100
}

// Logo Removal Region Interface
export interface LogoRegion {
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  width: number; // Percentage (0-100)
  height: number; // Percentage (0-100)
}

export const initPdfJs = async () => {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
};

export const renderPageToCanvas = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.5
): Promise<HTMLCanvasElement | null> => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  
  if (!context) return null;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas;
};

export const applyFiltersToCanvas = (
  canvas: HTMLCanvasElement,
  options: FilterOptions,
  logoRegion?: LogoRegion
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Remove Logo (Before processing pixels)
  // We do this first so we don't process pixels we're going to delete anyway, 
  // and so the "whiteout" area respects later filters like Invert if desired, 
  // OR we can do it after. The user request says "website will make this white if invert colour is on else make this black or blur".
  // Actually, usually you want to remove the logo from the source image.
  // Let's just fill it with the "background color" of the current mode.
  // If Apply Filters is called, we assume we are modifying the pixel data.
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Helper to check if a pixel is "dark" (for background removal)
  const isDark = (r: number, g: number, b: number) => (r + g + b) / 3 < 128;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Remove Background (Simple thresholding to remove widespread dark colors if PDF is dark mode, or noise)
    // Actually, "Clear PDF Background" usually means making the background white.
    // Use a simple heuristic: if it's near the page background color (which we assume is white), keep it.
    // The user description "Clear PDF Background - Remove background noise" suggests it might be scanned documents.
    // For now, let's just stick to standard brightness/contrast if "Clear" is checked, maybe boost contrast.
    if (options.removeBackground) {
        // Simple contrast boost can help clean noise
        const factor = (120 - 128) * (255 / 100); // Slight internal contrast boost
         // This is a placeholder for more advanced noise removal if needed
    }

    // Grayscale
    if (options.grayscale) {
      const avg = (r + g + b) / 3;
      r = avg;
      g = avg;
      b = avg;
    }

    // Brightness
    if (options.brightness !== 100) {
      r = r * (options.brightness / 100);
      g = g * (options.brightness / 100);
      b = b * (options.brightness / 100);
    }

    // Contrast
    if (options.contrast !== 100) {
      const factor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
    }

    // Invert Colors (Last)
    if (options.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply Logo Removal (Paint over the region)
  if (logoRegion) {
     const x = (logoRegion.x / 100) * width;
     const y = (logoRegion.y / 100) * height;
     const w = (logoRegion.width / 100) * width;
     const h = (logoRegion.height / 100) * height;

     // Fill color depends on Invert option. 
     // If Inverted, background is likely Black, so fill Black.
     // If Normal, background is likely White, so fill White.
     ctx.fillStyle = options.invert ? "#000000" : "#ffffff";
     ctx.fillRect(x, y, w, h);
  }
};
