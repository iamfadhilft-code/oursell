'use client';
import { useEffect } from 'react';
import { useInitializeDb } from '@/hooks/useInitializeDb';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { usePosStore } from '@/store/usePosStore';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isReady, error } = useInitializeDb();
  const checkSession = useBrandAuthStore((s) => s.checkSession);

  // Global physical network connectivity listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[OURSELL POS] Browser detected network: ONLINE');
      usePosStore.getState().setNetworkConnected(true);
    };

    const handleOffline = () => {
      console.log('[OURSELL POS] Browser detected network: OFFLINE');
      usePosStore.getState().setNetworkConnected(false);
    };

    // Initialize physical status
    usePosStore.getState().setNetworkConnected(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      checkSession();
      // Initialize pending sync count and auto-sync if connected
      const posState = usePosStore.getState();
      posState.refreshPendingSyncCount().then((count) => {
        if (count > 0 && posState.isOnline && typeof navigator !== 'undefined' && navigator.onLine) {
          posState.syncNow().catch((e) => console.warn('Initial sync deferred:', e));
        }
      });
    }
  }, [isReady, checkSession]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#080B12] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-black text-2xl shadow-xl shadow-teal-500/20 animate-pulse mb-4">
          O
        </div>
        <h2 className="text-base font-bold text-slate-200">Initializing OURSELL POS...</h2>
        <p className="text-xs text-slate-500 mt-1">Starting offline database & tenant runtime</p>
      </div>
    );
  }

  if (error) {
    console.warn('Database note:', error);
  }

  return <>{children}</>;
}
