'use client';
import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { BarcodeType, validateBarcode } from '@/utils/barcodeUtils';

interface BarcodeRendererProps {
  type: BarcodeType;
  value: string;
  width?: number; // bar width multiplier
  height?: number; // height in px
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
  onError?: (err: string | null) => void;
}

export function BarcodeRenderer({
  type,
  value,
  width = 1.5,
  height = 48,
  displayValue = true,
  fontSize = 12,
  className = '',
  onError,
}: BarcodeRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!value || !value.trim()) {
      setRenderError('No value provided');
      onError?.('No value provided');
      return;
    }

    const validation = validateBarcode(type, value);
    if (!validation.valid) {
      setRenderError(validation.error || 'Invalid format');
      onError?.(validation.error || 'Invalid format');
      return;
    }

    setRenderError(null);
    onError?.(null);

    if (type === 'QR') {
      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          validation.normalized,
          {
            width: height * 1.5,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          },
          (err) => {
            if (err) {
              setRenderError('QR generation error');
              onError?.('QR generation error');
            }
          }
        );
      }
    } else {
      if (svgRef.current) {
        try {
          let jsBarcodeFormat: string = 'CODE128';
          if (type === 'EAN13' && /^\d{12,13}$/.test(validation.normalized)) jsBarcodeFormat = 'EAN13';
          else if (type === 'EAN8' && /^\d{7,8}$/.test(validation.normalized)) jsBarcodeFormat = 'EAN8';
          else if (type === 'UPCA' && /^\d{11,12}$/.test(validation.normalized)) jsBarcodeFormat = 'UPC';
          else if (type === 'CODE39') jsBarcodeFormat = 'CODE39';

          JsBarcode(svgRef.current, validation.normalized, {
            format: jsBarcodeFormat,
            width,
            height,
            displayValue,
            fontSize,
            font: 'monospace',
            textMargin: 2,
            margin: 4,
            background: '#ffffff',
            lineColor: '#000000',
            valid: (valid) => {
              if (!valid) {
                // Graceful fallback to CODE128 for any alphanumeric codes
                try {
                  if (svgRef.current) {
                    JsBarcode(svgRef.current, value.trim(), {
                      format: 'CODE128',
                      width,
                      height,
                      displayValue,
                      fontSize,
                      font: 'monospace',
                      textMargin: 2,
                      margin: 4,
                      background: '#ffffff',
                      lineColor: '#000000',
                    });
                    setRenderError(null);
                    onError?.(null);
                  }
                } catch {
                  setRenderError(`Invalid ${type} format`);
                  onError?.(`Invalid ${type} format`);
                }
              }
            },
          });
        } catch (err: unknown) {
          // If formatting threw, try CODE128 fallback
          try {
            if (svgRef.current) {
              JsBarcode(svgRef.current, value.trim(), {
                format: 'CODE128',
                width,
                height,
                displayValue,
                fontSize,
                font: 'monospace',
                textMargin: 2,
                margin: 4,
                background: '#ffffff',
                lineColor: '#000000',
              });
              setRenderError(null);
              onError?.(null);
            }
          } catch {
            const msg = err instanceof Error ? err.message : 'Barcode render failed';
            setRenderError(msg);
            onError?.(msg);
          }
        }
      }
    }
  }, [type, value, width, height, displayValue, fontSize, onError]);

  if (renderError) {
    return (
      <div className={`flex flex-col items-center justify-center p-2 text-center bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-400 font-mono text-[11px] ${className}`}>
        <span>[Barcode Error]</span>
        <span className="text-[9px] text-red-500 mt-0.5">{renderError}</span>
      </div>
    );
  }

  if (type === 'QR') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <canvas ref={canvasRef} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto block mx-auto" />
    </div>
  );
}
