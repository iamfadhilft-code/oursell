'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Store, ArrowUpRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { PublicStoreNode } from '@/lib/auth/authService';
import { db, seedInitialData } from '@/db/posDb';

interface StoreDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSlug?: string;
}

export function StoreDiscoveryModal({
  isOpen,
  onClose,
  defaultSlug = '',
}: StoreDiscoveryModalProps) {
  const router = useRouter();
  // Keep input empty initially unless explicitly provided by caller
  const [slugInput, setSlugInput] = useState(defaultSlug || '');
  const [isLoading, setIsLoading] = useState(false);
  const [storeResult, setStoreResult] = useState<PublicStoreNode | null>(null);
  const [matchedStores, setMatchedStores] = useState<PublicStoreNode[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      seedInitialData().catch(() => {});
      if (!defaultSlug) {
        setSlugInput('');
        setStoreResult(null);
        setMatchedStores([]);
        setSearchError(null);
      } else {
        setSlugInput(defaultSlug);
        searchStore(defaultSlug);
      }
    }
  }, [isOpen, defaultSlug]);

  // Search function that queries actual registered store details from database
  const searchStore = async (query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setStoreResult(null);
      setMatchedStores([]);
      setSearchError(null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    // Immediate match for Dev Core Control Centre
    if (clean === 'devcore' || clean === 'dev core') {
      const devCoreNode: PublicStoreNode = {
        id: 'acc-devcore-root',
        slug: 'devcore',
        name: 'Dev Core Admin Control Centre',
        statusText: 'Super Admin Console',
        isActive: true,
        businessCategory: 'Control Centre',
      };
      setMatchedStores([devCoreNode]);
      setStoreResult(devCoreNode);
      setSearchError(null);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Direct query from local database (offline-first & demo store repository)
      const allBrands = await db.brands.toArray();
      const matches = allBrands.filter((b) => {
        const nameMatch = b.brandName?.toLowerCase().includes(clean);
        const idMatch = b.brandId?.toLowerCase().includes(clean);
        const userMatch = b.username?.toLowerCase().includes(clean);
        return nameMatch || idMatch || userMatch;
      });

      if (matches.length > 0) {
        const mapped: PublicStoreNode[] = matches.map((b) => ({
          id: b.id,
          slug: b.brandId || b.username,
          name: b.brandName,
          statusText: b.status === 'ACTIVE' ? 'Active Node' : (b.status || 'Registered'),
          isActive: b.status === 'ACTIVE',
          businessCategory: b.businessCategory || 'Retail Store',
        }));

        setMatchedStores(mapped);
        setStoreResult(mapped[0]); // default to primary match
        setSearchError(null);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to API route if local query didn't match
      const res = await fetch(`/api/store/discover?slug=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.store) {
          setStoreResult(data.store);
          setMatchedStores([data.store]);
          setSearchError(null);
          return;
        }
      }

      setStoreResult(null);
      setMatchedStores([]);
      setSearchError(`Store "${query.trim()}" is not registered in Oursell.`);
    } catch {
      setStoreResult(null);
      setMatchedStores([]);
      setSearchError(`Store "${query.trim()}" was not found.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search as user types - never overwrite manually entered values
  useEffect(() => {
    if (!isOpen) return;
    if (!slugInput.trim()) {
      setStoreResult(null);
      setMatchedStores([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(() => {
      searchStore(slugInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [slugInput, isOpen]);

  if (!isOpen) return null;

  const handleConnectTerminal = (targetSlug?: string) => {
    const slugToConnect = targetSlug || storeResult?.slug;
    if (!slugToConnect) return;
    onClose();
    if (slugToConnect === 'devcore') {
      router.push('/devcore');
    } else {
      router.push(`/login/${slugToConnect}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0D1211] border border-[#232D2B] rounded-[28px] max-w-lg w-full p-7 md:p-8 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
              <Search className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Connect to Your Store
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close discovery modal"
            className="w-8 h-8 rounded-full bg-[#161E1D] text-[#8E9B9A] hover:text-[#F8FAFC] flex items-center justify-center border border-[#232D2B] hover:border-[#384744] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-[#8E9B9A] mb-6 leading-relaxed">
          Search for your registered store name or handle to connect your terminal register.
        </p>

        {/* Search Input Box */}
        <div className="relative mb-3">
          <div className="w-full bg-[#080B0B] border border-[#232D2B] focus-within:border-[#C4F12A] focus-within:ring-1 focus-within:ring-[#C4F12A] rounded-2xl px-4 py-3.5 flex items-center gap-3 transition">
            <Search className="w-4 h-4 text-[#637270] shrink-0" />
            <input
              type="text"
              name="store_search_query"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              data-lpignore="true"
              autoFocus
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="Enter your store name"
              className="w-full bg-transparent text-[#F8FAFC] placeholder-[#637270] font-sans text-sm outline-none"
            />
            {isLoading && <Loader2 className="w-4 h-4 text-[#C4F12A] animate-spin shrink-0" />}
          </div>
        </div>

        {/* Matched Stores List if Multiple */}
        {matchedStores.length > 1 && (
          <div className="mb-3 max-h-48 overflow-y-auto space-y-2 pr-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9B9A] font-bold">
              Matching Registered Stores ({matchedStores.length}):
            </span>
            {matchedStores.map((store) => (
              <div
                key={store.id}
                onClick={() => setStoreResult(store)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  storeResult?.id === store.id
                    ? 'bg-[#182321] border-[#10B981] text-white'
                    : 'bg-[#121817] border-[#232D2B] text-[#8E9B9A] hover:bg-[#161F1E]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-[#10B981]" />
                  <div>
                    <h5 className="text-xs font-bold text-white">{store.name}</h5>
                    <span className="text-[10px] font-mono text-[#8E9B9A]">s/{store.slug}</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#10B981] font-semibold bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                  {store.businessCategory || 'Active'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Selected Store Result Card */}
        {storeResult && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
            <div className="bg-[#141B1A] border border-[#232D2B] rounded-2xl p-4 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#1C2624] border border-[#2B3936] flex items-center justify-center text-[#10B981]">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#F8FAFC] tracking-wide uppercase">
                    {storeResult.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-[#8E9B9A]">
                      s/{storeResult.slug}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] text-[#10B981] font-semibold">
                      {storeResult.statusText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[10px] font-mono text-[#10B981] font-bold uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Active Store
              </div>
            </div>

            {/* High-visibility Action Button */}
            <button
              type="button"
              onClick={() => handleConnectTerminal(storeResult.slug)}
              className="w-full py-4 rounded-2xl bg-[#C4F12A] hover:bg-[#b5e022] active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#C4F12A]/15 transition cursor-pointer"
            >
              <span>{storeResult.slug === 'devcore' ? 'CONNECT DEV CORE CONSOLE' : 'CONNECT TERMINAL'}</span>
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Not Found / Error State */}
        {!storeResult && searchError && !isLoading && slugInput.trim() !== '' && (
          <div className="bg-[#191313] border border-red-900/40 rounded-2xl p-4 flex items-start gap-3 text-left">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-300">
              <p className="font-bold">{searchError}</p>
              <p className="text-red-400/80 mt-1">
                Please check the spelling or register a new store brand on Oursell.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
