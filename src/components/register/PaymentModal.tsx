'use client';
import React, { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { PaymentMethod, Order } from '@/types/pos';
import { Banknote, CreditCard, QrCode, BookOpen, Layers, X, Check, AlertCircle, Lock } from 'lucide-react';
import { translations } from '@/lib/i18n';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const {
    getTotals,
    finalizeCheckout,
    selectedCustomer,
    currency,
    language,
    activeBrandId,
  } = usePosStore();

  const { planName, checkFeature } = usePlanAccess(activeBrandId);
  const khataFeature = checkFeature('customer_khata');
  const [isKhataGateOpen, setIsKhataGateOpen] = useState(false);

  const t = translations[language];
  const { grandTotal } = getTotals();

  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>(grandTotal.toString());
  const [cardAuth, setCardAuth] = useState<string>('');
  const [upiRef, setUpiRef] = useState<string>('');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, Math.round((tenderedNum - grandTotal) * 100) / 100);
  const isCashInsufficient = activeMethod === 'CASH' && tenderedNum < grandTotal;

  // Split calculations
  const splitTotal = (splitCash || 0) + (splitCard || 0);
  const splitRemaining = Math.max(0, Math.round((grandTotal - splitTotal) * 100) / 100);

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleFinalize = async () => {
    setErrorMsg(null);

    if (activeMethod === 'CASH' && isCashInsufficient) {
      setErrorMsg(`Insufficient cash tendered! Need at least ${currency}${grandTotal.toFixed(2)}`);
      return;
    }

    if (activeMethod === 'KHATA') {
      if (!khataFeature.allowed) {
        setIsKhataGateOpen(true);
        setErrorMsg('Customer Khata & Credit Ledger requires Professional or Enterprise subscription.');
        return;
      }
      if (!selectedCustomer) {
        setErrorMsg('Please select or link a customer first to charge to Khata / Store Credit');
        return;
      }
      const newBalance = selectedCustomer.storeCreditBalance + grandTotal;
      if (newBalance > selectedCustomer.creditLimit) {
        setErrorMsg(`Credit limit exceeded! Customer limit: ${currency}${selectedCustomer.creditLimit}, current balance: ${currency}${selectedCustomer.storeCreditBalance}`);
        return;
      }
    }

    if (activeMethod === 'SPLIT' && splitRemaining > 0) {
      setErrorMsg(`Split amounts do not cover total. ${currency}${splitRemaining.toFixed(2)} remaining.`);
      return;
    }

    setIsSubmitting(true);
    const result = await finalizeCheckout({
      method: activeMethod,
      cashTendered: activeMethod === 'CASH' ? tenderedNum : undefined,
      cardRefCode: activeMethod === 'CARD' ? cardAuth || 'AUTH-OFFLINE-OK' : undefined,
      upiRef: activeMethod === 'UPI' ? upiRef || 'UPI-APP-CONFIRMED' : undefined,
      splitDetails: activeMethod === 'SPLIT' ? { cash: splitCash, card: splitCard } : undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.order) {
      onSuccess(result.order);
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to complete transaction');
    }
  };

  // UPI payment QR string
  const upiUrl = `upi://pay?pa=centralmart@upi&pn=OursellCentralMart&am=${grandTotal.toFixed(2)}&cu=INR&tn=Invoice`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-[540px] w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-teal-400">
              {t.paymentModalTitle}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs text-slate-400">{t.totalDue}:</span>
              <span className="text-3xl font-extrabold text-white">
                {currency}{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tender Method Selector Tabs */}
        <div className="grid grid-cols-5 p-2 bg-slate-100 gap-1.5 border-b border-slate-200">
          <button
            onClick={() => setActiveMethod('CASH')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
              activeMethod === 'CASH'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{t.cash}</span>
          </button>
          <button
            onClick={() => setActiveMethod('UPI')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
              activeMethod === 'UPI'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t.upi}</span>
          </button>
          <button
            onClick={() => setActiveMethod('CARD')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
              activeMethod === 'CARD'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t.card}</span>
          </button>
          <button
            onClick={() => {
              if (!khataFeature.allowed) {
                setIsKhataGateOpen(true);
                return;
              }
              setActiveMethod('KHATA');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition relative ${
              !khataFeature.allowed
                ? 'bg-amber-50/70 text-amber-800 hover:bg-amber-100/70'
                : activeMethod === 'KHATA'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {!khataFeature.allowed ? (
              <Lock className="w-4 h-4 text-amber-600" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            <div className="flex items-center gap-1">
              <span>{t.khata}</span>
              {!khataFeature.allowed && (
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-black">
                  PRO
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveMethod('SPLIT');
              setSplitCash(Math.floor(grandTotal / 2));
              setSplitCard(Math.ceil(grandTotal / 2));
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
              activeMethod === 'SPLIT'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.split}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* CASH MODE */}
          {activeMethod === 'CASH' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {t.amountReceived} ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold text-base">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Fast Cash Amounts
                </span>
                <div className="grid grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(grandTotal)}
                    className="py-2 px-1 text-xs font-bold border border-teal-500 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition"
                  >
                    Exact
                  </button>
                  {[100, 200, 500, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="py-2 px-1 text-xs font-bold border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                    >
                      {currency}{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Due Highlight Box */}
              <div
                className={`p-4 rounded-2xl border transition ${
                  isCashInsufficient
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {isCashInsufficient ? 'Amount Remaining' : t.changeDue}
                    </span>
                    <div className="text-2xl font-black text-emerald-700 mt-0.5">
                      {isCashInsufficient
                        ? `${currency}${(grandTotal - tenderedNum).toFixed(2)}`
                        : `${currency}${changeDue.toFixed(2)}`}
                    </div>
                  </div>
                  {!isCashInsufficient && changeDue > 0 && (
                    <div className="px-3 py-1 bg-emerald-600 text-white text-xs font-extrabold rounded-full uppercase tracking-wider">
                      Return to Customer
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* UPI / QR MODE */}
          {activeMethod === 'UPI' && (
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <img
                  src={qrImageSrc}
                  alt="Dynamic UPI QR"
                  className="w-40 h-40 object-contain rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">centralmart@okaxis</p>
                <p className="text-xs text-slate-500">
                  Customer scans with Google Pay, PhonePe, Paytm or any UPI app
                </p>
              </div>
              <div className="w-full text-left">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  UPI Transaction ID / UTR (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 408291048291"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* CARD MODE */}
          {activeMethod === 'CARD' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-blue-600 shrink-0" />
                <div className="text-xs text-blue-900">
                  <p className="font-bold">Swipe / Tap Card on Terminal</p>
                  <p className="text-blue-700 mt-0.5">Contactless, Visa, Mastercard, RuPay & Amex supported.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {t.cardAuthCode} (RRN / Approval Code)
                </label>
                <input
                  type="text"
                  placeholder="e.g. AUTH-849201"
                  value={cardAuth}
                  onChange={(e) => setCardAuth(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* KHATA / STORE CREDIT MODE */}
          {activeMethod === 'KHATA' && (
            <div className="space-y-3">
              {selectedCustomer ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</h4>
                      <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                    </div>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Khata Account
                    </span>
                  </div>
                  <div className="pt-2 border-t border-amber-200/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Current Credit:</span>
                      <p className="font-bold text-slate-800">{currency}{selectedCustomer.storeCreditBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Credit Limit:</span>
                      <p className="font-bold text-slate-800">{currency}{selectedCustomer.creditLimit.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="pt-1 text-xs text-amber-900">
                    After this sale: <strong>{currency}{(selectedCustomer.storeCreditBalance + grandTotal).toFixed(2)}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Customer Linked</p>
                  <p className="text-xs text-slate-500">
                    Khata ledger purchases require linking an approved customer with a verified phone number.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SPLIT TENDER MODE */}
          {activeMethod === 'SPLIT' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cash Portion</label>
                  <input
                    type="number"
                    value={splitCash || ''}
                    onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Card / UPI Portion</label>
                  <input
                    type="number"
                    value={splitCard || ''}
                    onChange={(e) => setSplitCard(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between">
                <span>Split Allocated: <strong>{currency}{splitTotal.toFixed(2)}</strong></span>
                <span>Remaining: <strong>{currency}{splitRemaining.toFixed(2)}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={isSubmitting || (activeMethod === 'CASH' && isCashInsufficient)}
            onClick={handleFinalize}
            className="flex-[2] py-3 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            {isSubmitting ? 'Processing...' : t.finalizeSale}
          </button>
        </div>
      </div>

      <PlanGateModal
        isOpen={isKhataGateOpen}
        onClose={() => setIsKhataGateOpen(false)}
        title="Customer Khata & Credit Ledger"
        description="Allow approved customers to make purchases on store credit, track outstanding balances, and record payments directly from the POS register."
        requiredPlan="Professional"
        currentPlan={planName}
      />
    </div>
  );
}
