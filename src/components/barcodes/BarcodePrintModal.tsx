'use client';
import React, { useState } from 'react';
import { BarcodeRecord, Product } from '@/types/pos';
import { db } from '@/db/posDb';
import { BarcodeRenderer } from './BarcodeRenderer';
import { Printer, X, Download, Sliders, Check, FileText } from 'lucide-react';

interface PrintItem {
  barcodeValue: string;
  barcodeType: 'CODE128' | 'EAN13' | 'EAN8' | 'UPCA' | 'CODE39' | 'QR';
  productName: string;
  productSku: string;
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

  if (!isOpen || items.length === 0) return null;

  // Flatten items by quantity to get individual label tiles
  const flattenedLabels: PrintItem[] = [];
  items.forEach((item) => {
    for (let i = 0; i < (item.quantity || 1); i++) {
      flattenedLabels.push(item);
    }
  });

  const handlePrint = async () => {
    // Record in print logs
    try {
      for (const item of items) {
        await db.barcode_prints.add({
          id: `print-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          brandId,
          barcodeValue: item.barcodeValue,
          productName: item.productName,
          labelCount: item.quantity,
          labelSize,
          printedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Could not record print history', e);
    }

    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[92vh]">
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
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print Labels</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
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
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
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
                className="w-4 h-4 rounded text-teal-600"
              />
              <span>Show Price</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includeSku}
                onChange={(e) => setIncludeSku(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600"
              />
              <span>Show SKU</span>
            </label>
          </div>
        </div>

        {/* Print Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div
            className={`bg-white shadow-sm p-4 print:p-0 print:shadow-none ${
              labelSize === 'A4_Sheet'
                ? 'w-[210mm] min-h-[297mm] grid grid-cols-3 gap-2 border border-slate-300'
                : 'flex flex-wrap gap-3 max-w-2xl justify-center'
            }`}
          >
            {flattenedLabels.map((lbl, idx) => (
              <div
                key={idx}
                className={`border border-slate-300 rounded p-2 flex flex-col items-center justify-between text-center bg-white text-black font-sans leading-tight print:border-black ${
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
                <div className="font-bold truncate w-full text-center">
                  {lbl.productName}
                </div>

                {/* Scannable Barcode */}
                <div className="w-full flex items-center justify-center my-0.5">
                  <BarcodeRenderer
                    type={lbl.barcodeType}
                    value={lbl.barcodeValue}
                    width={labelSize === '38x25mm' ? 1.0 : 1.3}
                    height={labelSize === '38x25mm' ? 24 : labelSize === '60x40mm' ? 44 : 32}
                    fontSize={labelSize === '38x25mm' ? 8 : 10}
                    displayValue={true}
                  />
                </div>

                {/* Footer: Price & SKU */}
                <div className="w-full flex justify-between items-center font-mono text-[9px] px-1 border-t border-slate-100 pt-0.5">
                  {includeSku && <span className="truncate">{lbl.productSku}</span>}
                  {includePrice && (
                    <span className="font-bold ml-auto">
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
