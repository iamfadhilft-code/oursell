'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, seedInitialData } from '@/db/posDb';
import { Brand } from '@/types/pos';
import { Search, X, Store, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';

interface StoreDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStore?: (storeSlug: string) => void;
}

export function StoreDiscoveryModal({ isOpen, onClose, onSelectStore }: StoreDiscoveryModalProps) {
  const router = useRouter();
  const [slugInput, setSlugInput] = useState('');
  const [matchedStore, setMatchedStore] = useState<Brand | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      seedInitialData().catch(() => {});
      setSlugInput('');
      setMatchedStore(null);
      setIsSearching(false);
    }
  }, [isOpen]);

  const checkSlug = async (query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setMatchedStore(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const allBrands = await db.brands.toArray();
      const brand = allBrands.find((b) => {
        return (
          b.brandName?.toLowerCase().includes(trimmed) ||
          b.brandId?.toLowerCase().includes(trimmed) ||
          b.username?.toLowerCase().includes(trimmed)
        );
      });

      setMatchedStore(brand || null);
    } catch (err) {
      console.warn('Store discovery query error:', err);
      setMatchedStore(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSlugInput(val);
    checkSlug(val);
  };

  const handleConnect = () => {
    if (!matchedStore) return;
    const targetSlug = matchedStore.brandId || matchedStore.username || 'oursell';
    onClose();
    if (targetSlug === 'devcore') {
      router.push('/devcore');
      return;
    }
    if (onSelectStore) {
      onSelectStore(targetSlug);
    } else {
      router.push(`/login/${targetSlug}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#151D1C] border border-[#252F2D] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#080B0B] border border-[#252F2D] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <Search className="w-5 h-5 text-[#10B981]" />
          <h3 className="text-xl font-black text-[#F8FAFC] tracking-tight">Connect to Your Store</h3>
        </div>
        <p className="text-xs text-[#94A3B8] mb-5 leading-relaxed">
          Enter your registered store name or handle to connect your terminal register.
        </p>

        {/* Search Input Field */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#94A3B8]" />
          <input
            type="text"
            name="store_search_query"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            data-lpignore="true"
            value={slugInput}
            onChange={handleInputChange}
            placeholder="Enter your store name"
            className="w-full pl-10 pr-10 py-3 bg-[#080B0B] border border-[#252F2D] focus:border-[#C4F12A] focus:ring-1 focus:ring-[#C4F12A] rounded-2xl text-[#F8FAFC] placeholder-[#637270] focus:outline-none font-sans text-sm transition"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 absolute right-3.5 top-3.5 text-[#C4F12A] animate-spin" />
          )}
        </div>

        {/* Dynamic Store Card */}
        {matchedStore ? (
          <div className="space-y-4">
            <div className="bg-[#111717] border border-[#252F2D] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1A2624] text-[#10B981] flex items-center justify-center font-bold">
                  <Store className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#F8FAFC]">
                    {matchedStore.brandName}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      s/{matchedStore.brandId || matchedStore.username}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {matchedStore.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect Terminal CTA Button */}
            <button
              type="button"
              onClick={handleConnect}
              className="w-full py-3.5 bg-[#C4F12A] hover:bg-[#b0dc1e] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg shadow-[#C4F12A]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>CONNECT TERMINAL</span>
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        ) : slugInput.trim() !== '' && !isSearching ? (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>Store Node Not Found</span>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              No active store registered matching &quot;{slugInput}&quot;. Please verify spelling.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
