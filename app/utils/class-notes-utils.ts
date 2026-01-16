
import { PDFDocumentProxy } from "pdfjs-dist";

// Image Filter Options Interface
export interface FilterOptions {
  invert: boolean;
  grayscale: boolean;
  removeBackground: boolean;
  brightness: number; // 0 to 200, default 100
  contrast: number;   // 0 to 200, default 100
  saturation: number; // 0 to 200, default 100
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
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjs;
};

export const renderPageToCanvas = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.5,
  rotation: number = 0,
  crop?: LogoRegion
): Promise<HTMLCanvasElement | null> => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return null;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport,
    // Use PDF.js's internal image decoder instead of browser's native decoder
    renderInteractiveForms: false,
  } as any).promise;

  if (crop) {
    // Create cropped version
    const croppedCanvas = document.createElement('canvas');
    const cw = (crop.width / 100) * viewport.width;
    const ch = (crop.height / 100) * viewport.height;
    const cx = (crop.x / 100) * viewport.width;
    const cy = (crop.y / 100) * viewport.height;

    croppedCanvas.width = cw;
    croppedCanvas.height = ch;

    const croppedCtx = croppedCanvas.getContext('2d');
    if (croppedCtx) {
      croppedCtx.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
      return croppedCanvas;
    }
  }

  return canvas;
};

// Logo Removal Options Interface
export interface LogoOptions {
  enabled: boolean;
  region?: LogoRegion;
  fillType: 'white' | 'black' | 'custom' | 'blur';
  fillColor?: string;
  blurStrength?: number;
}

export const applyFiltersToCanvas = (
  canvas: HTMLCanvasElement,
  options: FilterOptions,
  logoOptions?: LogoOptions
) => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Process Pixels (Brightness, Contrast, Invert, Grayscale, etc.)
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Helper to check if a pixel is "dark" (for background removal)
  const isDark = (r: number, g: number, b: number) => (r + g + b) / 3 < 128;


  // Detect background color by sampling interior regions (not corners)
  let bgColor = { r: 255, g: 255, b: 255 }; // Default white
  if (options.removeBackground) {
    // Sample interior regions to avoid black borders/edges
    const samples: { r: number; g: number; b: number }[] = [];
    const margin = 0.15; // Sample 15% from edges
    const samplePositions = [
      { x: Math.floor(width * margin), y: Math.floor(height * margin) },           // Top-left interior
      { x: Math.floor(width * (1 - margin)), y: Math.floor(height * margin) },     // Top-right interior
      { x: Math.floor(width * margin), y: Math.floor(height * (1 - margin)) },     // Bottom-left interior
      { x: Math.floor(width * (1 - margin)), y: Math.floor(height * (1 - margin)) }, // Bottom-right interior
      { x: Math.floor(width * 0.5), y: Math.floor(height * margin) },              // Top-center
      { x: Math.floor(width * 0.5), y: Math.floor(height * (1 - margin)) },        // Bottom-center
    ];

    samplePositions.forEach(pos => {
      const idx = (pos.y * width + pos.x) * 4;
      if (idx < data.length) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Only sample if it's a light color (not black edges)
        // Skip dark pixels to avoid detecting black borders as background
        if (r + g + b > 200) {  // Only sample light pixels
          samples.push({ r, g, b });
        }
      }
    });

    // Average the valid samples to get background color
    if (samples.length > 0) {
      bgColor = {
        r: Math.round(samples.reduce((sum, s) => sum + s.r, 0) / samples.length),
        g: Math.round(samples.reduce((sum, s) => sum + s.g, 0) / samples.length),
        b: Math.round(samples.reduce((sum, s) => sum + s.b, 0) / samples.length)
      };
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];


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

    // Saturation
    if (options.saturation !== 100) {
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + (r - gray) * (options.saturation / 100);
      g = gray + (g - gray) * (options.saturation / 100);
      b = gray + (b - gray) * (options.saturation / 100);
    }

    // Invert Colors
    if (options.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    // Remove Background - Apply AFTER inversion for correct behavior
    if (options.removeBackground) {
      let targetBg = bgColor;

      // If inverted, invert the detected background color too
      if (options.invert) {
        targetBg = {
          r: 255 - bgColor.r,
          g: 255 - bgColor.g,
          b: 255 - bgColor.b
        };
      }

      // Calculate color distance from target background
      const distance = Math.sqrt(
        Math.pow(r - targetBg.r, 2) +
        Math.pow(g - targetBg.g, 2) +
        Math.pow(b - targetBg.b, 2)
      );

      // If similar to background, convert to white (or black if inverted)
      const tolerance = 40;
      if (distance < tolerance) {
        if (options.invert) {
          r = 0;  // Black background for inverted
          g = 0;
          b = 0;
        } else {
          r = 255;  // White background for normal
          g = 255;
          b = 255;
        }
      }
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);

  // 2. Apply Logo Removal
  if (logoOptions && logoOptions.enabled && logoOptions.region) {
    const region = logoOptions.region;
    const x = (region.x / 100) * width;
    const y = (region.y / 100) * height;
    const w = (region.width / 100) * width;
    const h = (region.height / 100) * height;

    ctx.save();

    if (logoOptions.fillType === 'blur') {
      // Blur Logic
      const strength = logoOptions.blurStrength || 5;
      ctx.filter = `blur(${strength}px)`;
      // Draw the region onto itself with blur
      // We need to act on the current canvas content (which has filters applied)
      // Note: drawImage(canvas, ...) draws the *original* state of canvas if we are drawing to itself in some browsers, 
      // but strictly speaking safe way is to draw to temp canvas or just rely on standard behavior.
      // For stability, let's just use the filter.

      // To blur *only* the region, we can clip or just drawImage the region back over itself with filter.
      // However, drawImage(thisCanvas) might not work as expected in all contexts if it's dirty.
      // Safer approach: Get image data of region, put on temp canvas, draw temp canvas back with filter.
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
        ctx.filter = `blur(${strength}px)`;
        ctx.drawImage(tempCanvas, x, y, w, h);
      }
    } else {
      // Solid Fill Logic
      let fill = "#ffffff";
      if (logoOptions.fillType === 'black') fill = "#000000";
      if (logoOptions.fillType === 'white') fill = "#ffffff";
      if (logoOptions.fillType === 'custom') fill = logoOptions.fillColor || "#ffffff";

      // Override if Invert is on and user picked simple Black/White? 
      // User asked for specific "White, Black, Custom". If they pick White, it should be White, regardless of Invert.
      // If they wanted "Match Background", that's different.
      // Let's stick to explicit choice.

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    }

    ctx.restore();
  }
};
