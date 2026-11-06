import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
  playSound?: boolean;
}

export function playBeepSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1200Hz pleasant scanner beep
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch {
    // Audio context may require prior user interaction
  }
}

export function useBarcodeScanner({
  onScan,
  minChars = 3,
  maxIntervalMs = 45,
  playSound = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in regular input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // If typing inside an input that is not the dedicated barcode search input
      if (isInput && !target.dataset.barcodeTarget) {
        return;
      }

      const now = performance.now();
      const diff = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        if (barcode.length >= minChars) {
          e.preventDefault();
          if (playSound) playBeepSound();
          onScan(barcode);
        }
        bufferRef.current = '';
        return;
      }

      // If keys arrive too slowly, it's manual user typing - reset buffer
      if (diff > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Accumulate standard printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, minChars, maxIntervalMs, playSound]);
}
