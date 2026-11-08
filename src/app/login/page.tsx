'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Store, ArrowLeft, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import { discoverStoreNode, PublicStoreNode } from '@/lib/auth/authService';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';

export default function LoginPage() {
  const router = useRouter();

  const [slugInput, setSlugInput] = useState('');
  const [storeResult, setStoreResult] = useState<PublicStoreNode | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search function
  const searchStore = async (query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setStoreResult(null);
      setSearchError(null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    // Immediate match for Dev Core Control Centre
    if (clean === 'devcore' || clean === 'dev core') {
      setStoreResult({
        id: 'acc-devcore-root',
        slug: 'devcore',
        name: 'Dev Core Admin Control Centre',
        statusText: 'Super Admin Console',
        isActive: true,
        businessCategory: 'Control Centre',
      });
      setSearchError(null);
      setIsLoading(false);
      return;
    }

    try {
      // Local DB check first
      const { db } = await import('@/db/posDb');
      const allBrands = await db.brands.toArray();
      const matched = allBrands.find((b) => {
        return (
          b.brandName?.toLowerCase().includes(clean) ||
          b.brandId?.toLowerCase().includes(clean) ||
          b.username?.toLowerCase().includes(clean)
        );
      });

      if (matched) {
        setStoreResult({
          id: matched.id,
          slug: matched.brandId || matched.username,
          name: matched.brandName,
          statusText: matched.status === 'ACTIVE' ? 'Active Store' : (matched.status || 'Registered'),
          isActive: matched.status === 'ACTIVE',
          businessCategory: matched.businessCategory || 'Retail Store',
        });
        setSearchError(null);
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/store/discover?slug=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (res.ok && data.exists && data.store) {
        setStoreResult(data.store);
        setSearchError(null);
      } else {
        setStoreResult(null);
        setSearchError(data.error || `Store "${query.trim()}" is not registered.`);
      }
    } catch {
      // Local fallback
      const localRes = await discoverStoreNode(clean);
      if (localRes.exists && localRes.store) {
        setStoreResult(localRes.store);
        setSearchError(null);
      } else {
        setStoreResult(null);
        setSearchError(localRes.error || `Store "${query.trim()}" is not registered.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!slugInput.trim()) {
      setStoreResult(null);
      setSearchError(null);
      return;
    }
    const timer = setTimeout(() => {
      searchStore(slugInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [slugInput]);

  const handleConnect = () => {
    if (!storeResult) return;
    if (storeResult.slug === 'devcore') {
      router.push('/devcore');
    } else {
      router.push(`/login/${storeResult.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B0B] text-[#F8FAFC] flex flex-col justify-between py-10 px-4 font-sans select-none">
      <div className="max-w-md w-full mx-auto">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-[#8E9B9A] hover:text-[#F8FAFC] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>
          <span className="text-[11px] font-mono font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full">
            RETAIL OS v3.0
          </span>
        </div>

        {/* Discovery Card */}
        <div className="bg-[#121615] border border-[#232D2B] rounded-3xl p-7 shadow-2xl text-left space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Connect to Your Store
              </h1>
              <p className="text-xs text-[#8E9B9A]">
                Enter your registered store name or handle to connect your register.
              </p>
            </div>
          </div>

          <div className="relative">
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

          {storeResult && (
            <div className="space-y-4 pt-2">
              <div className="bg-[#18201F] border border-[#273230] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#202B2A] flex items-center justify-center text-[#10B981]">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">{storeResult.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-[#8E9B9A]">s/${storeResult.slug}</span>
                      <span className="w-1 h-1 rounded-full bg-[#10B981]" />
                      <span className="text-[11px] text-[#10B981] font-semibold">Registered Store</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConnect}
                className="w-full py-4 rounded-2xl bg-[#C4F12A] hover:bg-[#b0db24] text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#C4F12A]/15 transition"
              >
                <span>CONNECT TERMINAL</span>
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}

          {!storeResult && searchError && !isLoading && (
            <div className="bg-[#191313] border border-red-900/40 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">
                <p className="font-bold">{searchError}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-[10px] font-mono text-[#4A5755]">
        OURSELL OS © 2026 • MULTI-STORE TENANT DISCOVERY
      </div>
    </div>
  );
}
