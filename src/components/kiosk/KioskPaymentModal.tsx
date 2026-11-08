'use client';
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  CreditCard,
  QrCode,
  Banknote,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Wifi,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface KioskPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  currency: string;
  onCompletePayment: (method: 'CARD' | 'UPI' | 'CASH') => Promise<void>;
  onCallAttendant: () => void;
}

export function KioskPaymentModal({
  isOpen,
  onClose,
  grandTotal,
  currency,
  onCompletePayment,
  onCallAttendant,
}: KioskPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'UPI' | 'CASH'>('CARD');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardTapped, setCardTapped] = useState(false);
  const [countdown, setCountdown] = useState(120);

  // Generate real dynamic UPI QR code
  useEffect(() => {
    if (!isOpen) return;

    const upiUri = `upi://pay?pa=oursell.express@bank&pn=Oursell+Express+Kiosk&am=${grandTotal.toFixed(
      2
    )}&cu=INR&tn=SelfCheckout_${Date.now().toString().slice(-6)}`;

    QRCode.toDataURL(upiUri, {
      width: 260,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrCodeUrl)
      .catch((err) => console.error('QR code generation error:', err));

    setCountdown(120);
    setIsProcessing(false);
    setCardTapped(false);
  }, [isOpen, grandTotal]);

  // Countdown timer for QR
  useEffect(() => {
    if (!isOpen || selectedMethod !== 'UPI') return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, selectedMethod]);

  if (!isOpen) return null;

  const handleSimulateCardPay = async () => {
    setCardTapped(true);
    setIsProcessing(true);
    setTimeout(async () => {
      await onCompletePayment('CARD');
      setIsProcessing(false);
    }, 1200);
  };

  const handleSimulateUpiPay = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      await onCompletePayment('UPI');
      setIsProcessing(false);
    }, 1000);
  };

  const handleSimulateCashPay = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      await onCompletePayment('CASH');
      setIsProcessing(false);
    }, 800);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-black tracking-widest text-emerald-400 uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                SECURE SELF-CHECKOUT
              </span>
              <span className="text-xs text-slate-400">Terminal #01</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">Select Payment Method</h2>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Amount Due</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {currency}{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Method Selector Tabs */}
          <div className="flex md:flex-col gap-3">
            <button
              onClick={() => setSelectedMethod('CARD')}
              className={`flex-1 p-4 rounded-2xl border text-left transition flex md:flex-col items-center md:items-start gap-3 ${
                selectedMethod === 'CARD'
                  ? 'bg-gradient-to-r md:bg-gradient-to-b from-teal-500/20 to-emerald-500/10 border-teal-400 text-white shadow-lg shadow-teal-500/10'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedMethod === 'CARD'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">Card / Tap</span>
                <span className="text-[11px] opacity-70 block">Credit, Debit, Apple Pay</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('UPI')}
              className={`flex-1 p-4 rounded-2xl border text-left transition flex md:flex-col items-center md:items-start gap-3 ${
                selectedMethod === 'UPI'
                  ? 'bg-gradient-to-r md:bg-gradient-to-b from-teal-500/20 to-emerald-500/10 border-teal-400 text-white shadow-lg shadow-teal-500/10'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedMethod === 'UPI'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">Scan UPI QR</span>
                <span className="text-[11px] opacity-70 block">GPay, PhonePe, Paytm</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('CASH')}
              className={`flex-1 p-4 rounded-2xl border text-left transition flex md:flex-col items-center md:items-start gap-3 ${
                selectedMethod === 'CASH'
                  ? 'bg-gradient-to-r md:bg-gradient-to-b from-teal-500/20 to-emerald-500/10 border-teal-400 text-white shadow-lg shadow-teal-500/10'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedMethod === 'CASH'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">Cash Acceptor</span>
                <span className="text-[11px] opacity-70 block">Insert currency bills</span>
              </div>
            </button>
          </div>

          {/* Interactive Payment Stage */}
          <div className="md:col-span-2 bg-slate-950/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between items-center text-center min-h-[340px]">
            {selectedMethod === 'CARD' && (
              <div className="w-full flex flex-col items-center justify-center space-y-5 my-auto">
                {/* Contactless Animation Graphic */}
                <div className="relative w-28 h-28 rounded-3xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-xl">
                  {/* Radiating Waves */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-teal-400/40 animate-ping opacity-75" />
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400 text-teal-400 flex items-center justify-center">
                    <Wifi className="w-7 h-7 rotate-90" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">Tap, Insert, or Swipe</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Hold your contactless card, smartphone, or smartwatch near the terminal.
                  </p>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleSimulateCardPay}
                  className="w-full max-w-xs py-3.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl transition shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing Card...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Simulate Contactless Tap</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {selectedMethod === 'UPI' && (
              <div className="w-full flex flex-col items-center justify-center space-y-4 my-auto">
                <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-teal-400/80">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="UPI Payment QR Code"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      Loading QR...
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires in {formatTime(countdown)}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM)
                  </p>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleSimulateUpiPay}
                  className="w-full max-w-xs py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Confirming UPI Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate UPI Payment Success</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {selectedMethod === 'CASH' && (
              <div className="w-full flex flex-col items-center justify-center space-y-5 my-auto">
                {/* Cash Acceptor Graphic */}
                <div className="w-56 h-28 bg-slate-900 border-2 border-slate-700 rounded-2xl flex flex-col items-center justify-center p-3 relative shadow-xl">
                  <div className="w-44 h-3 bg-slate-950 rounded-full border border-teal-500/50 shadow-[0_0_12px_rgba(20,184,166,0.3)] animate-pulse mb-3" />
                  <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-wider">
                    INSERT BILLS FACE UP
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">Automated Cash Slot</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Please insert exact amount or larger bills. Change is dispensed below.
                  </p>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleSimulateCashPay}
                  className="w-full max-w-xs py-3.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl transition shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Accepting Cash...</span>
                    </>
                  ) : (
                    <>
                      <Banknote className="w-4 h-4" />
                      <span>Insert {currency}{grandTotal.toFixed(2)} & Complete</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onCallAttendant}
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition font-bold"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Need Assistance? Call Attendant</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition"
          >
            Cancel & Return to Tray
          </button>
        </div>
      </div>
    </div>
  );
}
