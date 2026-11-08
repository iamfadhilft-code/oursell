'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  X,
  Scan,
  AlertTriangle,
  Sparkles,
  Zap,
} from 'lucide-react';

interface KioskCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function KioskCameraScannerModal({
  isOpen,
  onClose,
  onScan,
}: KioskCameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [detectorAvailable, setDetectorAvailable] = useState(false);

  const lastScannedTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Handle successful detection with debounce
  const handleBarcodeFound = useCallback(
    (code: string) => {
      const now = Date.now();
      const clean = code.trim();
      if (!clean) return;

      // Prevent duplicate scan of the same barcode within 1500ms
      if (
        lastScannedTimeRef.current.code === clean &&
        now - lastScannedTimeRef.current.time < 1500
      ) {
        return;
      }

      lastScannedTimeRef.current = { code: clean, time: now };
      setLastScannedCode(clean);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(60);
        } catch {}
      }

      onScan(clean);

      // Reset last scanned flash after 1.2s
      setTimeout(() => {
        setLastScannedCode((curr) => (curr === clean ? null : curr));
      }, 1200);
    },
    [onScan]
  );

  // Start Video Stream
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCameraError(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        // Check torch support
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
        setHasTorch(Boolean(capabilities?.torch));
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not access camera. Please ensure permissions are granted.';
        setCameraError(msg);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, facingMode]);

  // Barcode Detection Loop
  useEffect(() => {
    if (!isOpen || !stream || cameraError) return;

    let detector: any = null;
    const isBarcodeDetectorAvailable =
      typeof window !== 'undefined' && 'BarcodeDetector' in window;

    setDetectorAvailable(isBarcodeDetectorAvailable);

    if (isBarcodeDetectorAvailable) {
      try {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        detector = new BarcodeDetectorClass({
          formats: [
            'ean_13',
            'ean_8',
            'code_128',
            'code_39',
            'upc_a',
            'upc_e',
            'qr_code',
          ],
        });
      } catch (e) {
        console.warn('BarcodeDetector initialization fallback:', e);
      }
    }

    let isDetecting = false;

    const detectFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      if (detector && !isDetecting) {
        isDetecting = true;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            if (rawVal) {
              handleBarcodeFound(rawVal);
            }
          }
        } catch {
          // ignore transient frame decode errors
        } finally {
          isDetecting = false;
        }
      }

      animFrameRef.current = requestAnimationFrame(detectFrame);
    };

    animFrameRef.current = requestAnimationFrame(detectFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, stream, cameraError, handleBarcodeFound]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch constraint error:', e);
    }
  };

  // Flip Camera
  const toggleFacingMode = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Live Camera Barcode Scanner</h3>
              <p className="text-[11px] text-teal-400 font-medium">
                Hold product barcode inside the green reticle
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-8 text-center space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Camera Unavailable</h4>
              <p className="text-xs text-slate-400">{cameraError}</p>
              <p className="text-[11px] text-teal-400 font-medium pt-1">
                You can still scan directly using any USB/Bluetooth laser scanner or the manual barcode input dock!
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Graphic */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Reticle Box */}
                <div className="relative w-64 h-44 rounded-2xl border-2 border-dashed border-teal-400/80 bg-teal-500/5 shadow-[0_0_25px_rgba(20,184,166,0.3)] flex items-center justify-center overflow-hidden">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-300" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-300" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-300" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-300" />

                  {/* Laser Sweeping Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />

                  <span className="text-[10px] font-mono font-bold tracking-widest text-teal-300 uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs">
                    AIM BARCODE HERE
                  </span>
                </div>
              </div>

              {/* Detected Toast Overlay */}
              {lastScannedCode && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center gap-2 animate-bounce">
                  <Sparkles className="w-3.5 h-3.5" />
                  Scanned: {lastScannedCode}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFacingMode}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition"
              title="Switch Camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip Cam</span>
            </button>

            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isTorchOn ? 'Torch On' : 'Torch'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              {detectorAvailable ? '● Hardware AI Detection' : '● Optical Frame Feed'}
            </span>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black transition"
            >
              Done Scanning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
