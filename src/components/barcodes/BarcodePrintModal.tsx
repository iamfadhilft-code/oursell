'use client';
import React, { useState } from 'react';
import { BarcodeRecord, Product } from '@/types/pos';
import { db } from '@/db/posDb';
import { BarcodeRenderer } from './BarcodeRenderer';
import { calculateEan13CheckDigit, BarcodeType } from '@/utils/barcodeUtils';
import { Printer, X, Download, Sliders, Check, FileText } from 'lucide-react';

interface PrintItem {
  barcodeValue: string;
  barcodeType: 'CODE128' | 'EAN13' | 'EAN8' | 'UPCA' | 'CODE39' | 'QR';
  productName: string;
  productSku?: string;
  sku?: string;
  sellingPrice: number;
  quantity: number;
}

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PrintItem[];
  currency?: string;
  brandId: string;
}

export function BarcodePrintModal({
  isOpen,
  onClose,
  items,
  currency = '₹',
  brandId,
}: BarcodePrintModalProps) {
  const [labelSize, setLabelSize] = useState<'50x25mm' | '38x25mm' | '60x40mm' | 'A4_Sheet'>('50x25mm');
  const [includePrice, setIncludePrice] = useState(true);
  const [includeSku, setIncludeSku] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || items.length === 0) return null;

  // Flatten items by quantity to get individual label tiles with normalized barcodes
  const flattenedLabels: Array<PrintItem & { cleanBarcode: string; displaySku: string }> = [];
  items.forEach((item) => {
    let cleanBarcode = (item.barcodeValue || '').trim();
    // Normalize 12-digit numeric code to real 13-digit EAN-13
    if (cleanBarcode.length === 12 && /^\d{12}$/.test(cleanBarcode)) {
      const check = calculateEan13CheckDigit(cleanBarcode);
      cleanBarcode = cleanBarcode + check.toString();
    }
    const displaySku = item.productSku || item.sku || '';

    const count = Math.max(1, item.quantity || 1);
    for (let i = 0; i < count; i++) {
      flattenedLabels.push({
        ...item,
        cleanBarcode,
        displaySku,
      });
    }
  });

  const handlePrint = async () => {
    setIsPrinting(true);

    // 1. Record print audit in IndexedDB
    try {
      for (const item of items) {
        await db.barcode_prints.add({
          id: `print-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          brandId,
          barcodeValue: item.barcodeValue,
          productName: item.productName,
          labelCount: item.quantity || 1,
          labelSize,
          printedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Could not record print history', e);
    }

    // 2. Extract rendered barcode labels from DOM
    const printContainer = document.getElementById('barcode-printable-labels');
    if (!printContainer) {
      window.print();
      setIsPrinting(false);
      return;
    }

    // Remove any previous print iframe
    const oldIframe = document.getElementById('barcode-print-frame');
    if (oldIframe) oldIframe.remove();

    // 3. Create isolated iframe to bypass any global CSS and layout interference
    const iframe = document.createElement('iframe');
    iframe.id = 'barcode-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      setIsPrinting(false);
      return;
    }

    // Dynamic label sizing CSS
    let sizeCss = '';
    if (labelSize === '38x25mm') {
      sizeCss = `
        @page { size: 38mm 25mm; margin: 0; }
        .label-card { width: 38mm; height: 25mm; page-break-after: always; break-after: page; }
      `;
    } else if (labelSize === '50x25mm') {
      sizeCss = `
        @page { size: 50mm 25mm; margin: 0; }
        .label-card { width: 50mm; height: 25mm; page-break-after: always; break-after: page; }
      `;
    } else if (labelSize === '60x40mm') {
      sizeCss = `
        @page { size: 60mm 40mm; margin: 0; }
        .label-card { width: 60mm; height: 40mm; page-break-after: always; break-after: page; }
      `;
    } else {
      // A4 Sheet: 3 columns x 8 rows = 24 labels
      sizeCss = `
        @page { size: A4 portrait; margin: 8mm 6mm; }
        .print-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.5mm;
          width: 100%;
        }
        .label-card {
          height: 33mm;
          page-break-inside: avoid;
          break-inside: avoid;
          border: 0.5px dashed #aaa;
        }
      `;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Print Barcode Labels - Oursell</title>
          <style>
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            ${sizeCss}
            .label-card {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              padding: 1.5mm;
              overflow: hidden;
              background: #ffffff;
            }
            .label-title {
              font-size: 8pt;
              font-weight: 700;
              width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.1;
            }
            .label-barcode-wrap {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex: 1;
              margin: 0.5mm 0;
            }
            .label-barcode-wrap svg {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .label-footer {
              width: 100%;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-family: monospace;
              font-size: 7.5pt;
              border-top: 0.5px solid #e2e8f0;
              padding-top: 0.5mm;
              line-height: 1;
            }
            .label-sku {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 60%;
            }
            .label-price {
              font-weight: 900;
              margin-left: auto;
            }
          </style>
        </head>
        <body>
          <div class="${labelSize === 'A4_Sheet' ? 'print-grid' : ''}">
            ${printContainer.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print once iframe parses styles and SVGs
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Iframe print failed, falling back to window.print', err);
        window.print();
      } finally {
        setIsPrinting(false);
        setTimeout(() => iframe.remove(), 2000);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:static print:bg-white print:p-0 print:m-0 print:overflow-visible">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[92vh] print:rounded-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:overflow-visible">
        {/* Top Header - Hidden in Print */}
        <div className="no-print p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">Barcode Label Print Studio</h3>
              <p className="text-[11px] text-slate-400">
                Total {flattenedLabels.length} label(s) across {items.length} product(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Preparing Print...' : 'Print Labels'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls Toolbar - Hidden in Print */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Label Dimensions:</span>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="50x25mm">50 × 25 mm (Standard Thermal Roll)</option>
              <option value="38x25mm">38 × 25 mm (Compact Sticker)</option>
              <option value="60x40mm">60 × 40 mm (Large Retail Sticker)</option>
              <option value="A4_Sheet">A4 Sheet (24 Labels: 3×8 Grid)</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includePrice}
                onChange={(e) => setIncludePrice(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
              />
              <span>Show Price</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includeSku}
                onChange={(e) => setIncludeSku(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
              />
              <span>Show SKU</span>
            </label>
          </div>
        </div>

        {/* Print Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:overflow-visible print:p-0 print:m-0 print:bg-white print:block">
          <div
            id="barcode-printable-labels"
            className={`barcode-print-area bg-white shadow-sm p-4 print:p-0 print:shadow-none ${
              labelSize === 'A4_Sheet'
                ? 'w-[210mm] min-h-[297mm] grid grid-cols-3 gap-2 border border-slate-300'
                : 'flex flex-wrap gap-3 max-w-2xl justify-center'
            }`}
          >
            {flattenedLabels.map((lbl, idx) => (
              <div
                key={idx}
                className={`label-card border border-slate-300 rounded p-2 flex flex-col items-center justify-between text-center bg-white text-black font-sans leading-tight print:border-black ${
                  labelSize === '38x25mm'
                    ? 'w-[38mm] h-[25mm] p-1 text-[9px]'
                    : labelSize === '60x40mm'
                    ? 'w-[60mm] h-[40mm] p-2 text-xs'
                    : labelSize === 'A4_Sheet'
                    ? 'h-[34mm] text-[10px] p-2'
                    : 'w-[50mm] h-[28mm] p-1.5 text-[10px]'
                }`}
              >
                {/* Product Name Header */}
                <div className="label-title font-bold truncate w-full text-center">
                  {lbl.productName}
                </div>

                {/* Scannable Real Barcode */}
                <div className="label-barcode-wrap w-full flex items-center justify-center my-0.5">
                  <BarcodeRenderer
                    type={lbl.barcodeType}
                    value={lbl.cleanBarcode}
                    width={labelSize === '38x25mm' ? 1.0 : 1.3}
                    height={labelSize === '38x25mm' ? 24 : labelSize === '60x40mm' ? 44 : 32}
                    fontSize={labelSize === '38x25mm' ? 8 : 10}
                    displayValue={true}
                  />
                </div>

                {/* Footer: Price & SKU */}
                <div className="label-footer w-full flex justify-between items-center font-mono text-[9px] px-1 border-t border-slate-100 pt-0.5">
                  {includeSku && (
                    <span className="label-sku truncate text-slate-700 font-semibold">
                      {lbl.displaySku}
                    </span>
                  )}
                  {includePrice && (
                    <span className="label-price font-bold ml-auto text-black">
                      {currency}{lbl.sellingPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
