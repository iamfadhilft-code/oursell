'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/db/posDb';
import { Product, BarcodeRecord, BarcodePrintLog } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { BarcodeRenderer } from '@/components/barcodes/BarcodeRenderer';
import { BarcodePrintModal } from '@/components/barcodes/BarcodePrintModal';
import {
  BarcodeType,
  validateBarcode,
  generateCompliantBarcode,
} from '@/utils/barcodeUtils';
import {
  Barcode,
  Plus,
  Search,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Package,
  Layers,
} from 'lucide-react';

export default function StoreBarcodeStudioPage() {
  const params = useParams();
  const storeSlug = (params?.storeSlug as string) || 'oursell';

  const { currency, setActiveBrand } = usePosStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [barcodes, setBarcodes] = useState<BarcodeRecord[]>([]);
  const [printLogs, setPrintLogs] = useState<BarcodePrintLog[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('EAN13');
  const [barcodeValue, setBarcodeValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [itemsToPrint, setItemsToPrint] = useState<any[]>([]);

  const loadData = async () => {
    setActiveBrand(storeSlug, storeSlug === 'oursell' ? 'Oursell Demo Store' : storeSlug);

    let prods = await db.products.where('brandId').equals(storeSlug).toArray();
    if (prods.length === 0) prods = await db.products.where('brandId').equals('oursell').toArray();
    if (prods.length === 0) prods = await db.products.toArray();

    const [bars, logs] = await Promise.all([
      db.barcodes.where('brandId').equals(storeSlug).reverse().sortBy('createdAt'),
      db.barcode_prints.where('brandId').equals(storeSlug).reverse().sortBy('printedAt'),
    ]);

    setProducts(prods);
    setBarcodes(bars);
    setPrintLogs(logs);

    if (prods.length > 0 && !selectedProductId) {
      handleSelectProduct(prods[0].id, prods);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeSlug]);

  const handleSelectProduct = (pId: string, currentProds = products) => {
    setSelectedProductId(pId);
    const prod = currentProds.find((p) => p.id === pId);
    if (prod) {
      if (prod.barcode && prod.barcode.trim()) {
        setBarcodeValue(prod.barcode);
        if (prod.barcode.length === 13) setBarcodeType('EAN13');
        else if (prod.barcode.length === 8) setBarcodeType('EAN8');
        else if (prod.barcode.length === 12) setBarcodeType('UPCA');
        else setBarcodeType('CODE128');
      } else {
        const generated = generateCompliantBarcode('EAN13');
        setBarcodeValue(generated);
        setBarcodeType('EAN13');
      }
    }
  };

  const handleAutoGenerate = () => {
    const code = generateCompliantBarcode(barcodeType);
    setBarcodeValue(code);
    setValidationError(null);
  };

  const handleSaveBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const valRes = validateBarcode(barcodeType, barcodeValue);
    if (!valRes.valid) {
      setValidationError(valRes.error || 'Invalid barcode value');
      return;
    }

    // Save against product in DB
    await db.products.update(prod.id, { barcode: barcodeValue });

    // Save in barcodes table
    const existingRec = barcodes.find((b) => b.productId === prod.id);
    const record: BarcodeRecord = {
      id: existingRec ? existingRec.id : `bar-${Date.now()}`,
      brandId: storeSlug,
      productId: prod.id,
      productName: prod.title,
      productSku: prod.sku,
      sellingPrice: prod.sellingPrice,
      barcodeValue,
      barcodeType,
      labelSize: '50x25mm',
      createdAt: existingRec ? existingRec.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.barcodes.put(record);

    setNotice(`Barcode ${barcodeValue} saved successfully to ${prod.title}!`);
    setTimeout(() => setNotice(null), 3500);
    loadData();
  };

  const handleOpenPrintModal = (prod: Product, bValue?: string) => {
    setItemsToPrint([
      {
        id: prod.id,
        productId: prod.id,
        productName: prod.title,
        barcodeValue: bValue || prod.barcode || barcodeValue,
        barcodeType,
        sellingPrice: prod.sellingPrice,
        productSku: prod.sku,
        sku: prod.sku,
        quantity: 1,
      },
    ]);
    setIsPrintModalOpen(true);
  };

  const selectedProd = products.find((p) => p.id === selectedProductId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans select-none flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/shop/${storeSlug}`}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition border border-slate-200"
            title="Back to Store Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-bold text-sm text-slate-900">
              Oursell Barcode Studio • {storeSlug === 'oursell' ? 'Oursell Demo Store' : storeSlug}
            </h1>
            <span className="text-[11px] text-slate-500 font-mono">
              EAN-13, EAN-8, UPC-A, Code 128 & QR Code Label Generation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pos/register"
            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <span>Open POS</span>
          </Link>
        </div>
      </header>

      {/* Notification Toast */}
      {notice && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Studio Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-6">
        {/* LEFT: GENERATOR FORM */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900">Barcode Generator</h3>
            <p className="text-xs text-slate-500">
              Generate or assign standard optical barcodes to your catalog items.
            </p>
          </div>

          <form onSubmit={handleSaveBarcode} className="space-y-4 text-xs">
            {/* Product Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Catalog Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-semibold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.sku}) - {p.barcode ? `Barcode: ${p.barcode}` : 'NO BARCODE'}
                  </option>
                ))}
              </select>
            </div>

            {/* Barcode Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Barcode Standard</label>
                <select
                  value={barcodeType}
                  onChange={(e) => {
                    setBarcodeType(e.target.value as BarcodeType);
                    setValidationError(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono font-bold"
                >
                  <option value="EAN13">EAN-13 (Standard Retail)</option>
                  <option value="EAN8">EAN-8 (Compact Item)</option>
                  <option value="UPCA">UPC-A (North American)</option>
                  <option value="CODE128">Code 128 (Alphanumeric)</option>
                  <option value="QR">QR Code</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Auto-Generate</label>
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Generate Valid Code</span>
                </button>
              </div>
            </div>

            {/* Barcode Value Input */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode Value / Digits</label>
              <input
                type="text"
                required
                value={barcodeValue}
                onChange={(e) => {
                  setBarcodeValue(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g. 890103000001"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm tracking-wider focus:bg-white focus:outline-none focus:border-teal-600 font-bold"
              />
              {validationError && (
                <span className="text-[11px] text-red-500 font-semibold block mt-1">
                  {validationError}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Save to Product Database</span>
              </button>
              {selectedProd && (
                <button
                  type="button"
                  onClick={() => handleOpenPrintModal(selectedProd, barcodeValue)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-[#C4F12A]" />
                  <span>Print Labels</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT: LIVE OPTICAL SCANNER PREVIEW */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between items-center text-center space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">Live Optical Preview</h3>
            <p className="text-xs text-slate-500">
              Scannable barcode generated using precision vector SVG.
            </p>
          </div>

          {/* Physical Sticker Card */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-sm">
            <div className="text-xs font-bold text-slate-900 mb-1">
              {selectedProd?.title || 'Selected Product'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mb-2">
              SKU: {selectedProd?.sku || 'SKU-001'}
            </div>

            {/* Vector Barcode */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-center">
              <BarcodeRenderer
                value={barcodeValue || '890103000001'}
                type={barcodeType}
                width={2}
                height={65}
                displayValue={true}
              />
            </div>

            <div className="text-sm font-black text-slate-900 font-mono mt-2">
              {currency}
              {selectedProd?.sellingPrice?.toFixed(2) || '0.00'}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
            ✓ 100% Optical Certified for USB & Bluetooth HID Scanners
          </div>
        </div>
      </main>

      {/* Print Modal */}
      {isPrintModalOpen && (
        <BarcodePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          items={itemsToPrint}
          brandId={storeSlug}
        />
      )}
    </div>
  );
}
