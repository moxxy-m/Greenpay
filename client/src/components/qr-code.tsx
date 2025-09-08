import React, { useEffect, useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 192, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR code pattern simulation
    // In a real app, you'd use a QR code library like qrcode or react-qr-code
    const moduleSize = size / 25;
    const modules = 25;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    // Draw finder patterns (corners)
    ctx.fillStyle = 'black';
    
    // Top-left finder pattern
    drawFinderPattern(ctx, 0, 0, moduleSize);
    
    // Top-right finder pattern
    drawFinderPattern(ctx, (modules - 7) * moduleSize, 0, moduleSize);
    
    // Bottom-left finder pattern
    drawFinderPattern(ctx, 0, (modules - 7) * moduleSize, moduleSize);

    // Draw some random data modules for visual effect
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        // Skip finder pattern areas
        if (isInFinderPattern(i, j, modules)) continue;
        
        // Generate pseudo-random pattern based on position and value
        const hash = simpleHash(value + i + j);
        if (hash % 3 === 0) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  }, [value, size]);

  function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
    // Outer black square (7x7)
    ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
    
    // Inner white square (5x5)
    ctx.fillStyle = 'white';
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
    
    // Center black square (3x3)
    ctx.fillStyle = 'black';
    ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
  }

  function isInFinderPattern(i: number, j: number, modules: number): boolean {
    // Top-left
    if (i < 9 && j < 9) return true;
    // Top-right
    if (i >= modules - 8 && j < 9) return true;
    // Bottom-left
    if (i < 9 && j >= modules - 8) return true;
    return false;
  }

  function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`border border-border rounded-lg ${className}`}
      data-testid="qr-code"
    />
  );
}
