'use client';
import React, { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { Language } from '@/types/pos';
import {
  Settings,
  Store,
  Printer,
  Globe,
  DollarSign,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    brandName,
    activeBrandId,
    currency,
    language,
    setLanguage,
  } = usePosStore();

  const [storeName, setStoreName] = useState(brandName);
  const [storeCurrency, setStoreCurrency] = useState(currency);
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm');
  const [gstin, setGstin] = useState('29ABCDE1234F1Z5');
  const [address, setAddress] = useState('102 Brigade Road, Commercial Hub, Bangalore');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    usePosStore.setState({
      brandName: storeName,
      currency: storeCurrency,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-teal-600" />
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Store Settings & Hardware Configuration
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize receipt layout, currency symbols, multi-lingual interface and tax compliance details.
            </p>
          </div>

          {savedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Store Information */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Store className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Store Identity</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Store Display Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Brand ID (Sandboxed)</label>
                  <input
                    type="text"
                    disabled
                    value={activeBrandId}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Currency Symbol</label>
                  <select
                    value={storeCurrency}
                    onChange={(e) => setStoreCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                  >
                    <option value="₹">₹ (INR - Indian Rupee)</option>
                    <option value="$">$ (USD / CAD - Dollar)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="£">£ (GBP - Pound)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Outlet Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Language & RTL Settings */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Globe className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Interface Language</h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { id: 'en', label: 'English', sub: 'Default Left-to-Right' },
                  { id: 'ml', label: 'മലയാളം (Malayalam)', sub: 'South Indian Regional' },
                  { id: 'ar', label: 'العربية (Arabic)', sub: 'Full RTL Right-to-Left' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id as Language)}
                    className={`p-4 rounded-2xl border text-left transition ${
                      language === item.id
                        ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold text-xs text-slate-900 block">{item.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt & Printer Hardware Settings */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Printer className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Thermal Receipt Printing</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaperSize('80mm')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    paperSize === '80mm'
                      ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-extrabold text-xs text-slate-900 block">80mm Thermal Roll</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Standard high-density retail receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperSize('58mm')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    paperSize === '58mm'
                      ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-extrabold text-xs text-slate-900 block">58mm Handheld Roll</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Compact mobile / Bluetooth printer format</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-2xl shadow-md shadow-teal-600/20 transition"
            >
              Save Configuration
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
