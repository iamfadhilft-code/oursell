'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { Supplier, PurchaseOrder, Product } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  PackageCheck,
  FileText,
  Building,
  Phone,
  Mail,
  X,
  Layers,
} from 'lucide-react';

export default function PurchasingPage() {
  const { activeBrandId, currency } = usePosStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);

  // New Supplier Form
  const [supName, setSupName] = useState('');
  const [supPerson, setSupPerson] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [supTerms, setSupTerms] = useState<'NET_15' | 'NET_30' | 'COD'>('NET_30');

  // New PO Form
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poSelectedProdId, setPoSelectedProdId] = useState('');
  const [poQty, setPoQty] = useState(50);
  const [poCost, setPoCost] = useState(20);

  const loadData = async () => {
    const [sups, pos, prods] = await Promise.all([
      db.suppliers.toArray(),
      db.purchase_orders.reverse().sortBy('createdAt'),
      db.products.toArray(),
    ]);
    setSuppliers(sups);
    setPurchaseOrders(pos);
    setProducts(prods);
    if (sups.length > 0 && !poSupplierId) {
      setPoSupplierId(sups[0].id);
    }
    if (prods.length > 0 && !poSelectedProdId) {
      setPoSelectedProdId(prods[0].id);
      setPoCost(prods[0].costPrice);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBrandId]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      brandId: activeBrandId,
      name: supName.trim(),
      contactPerson: supPerson.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim() || undefined,
      gstin: supGstin.trim() || undefined,
      paymentTerms: supTerms,
    };

    await db.suppliers.add(newSup);
    setIsAddSupplierOpen(false);
    setSupName('');
    setSupPerson('');
    setSupPhone('');
    loadData();
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === poSupplierId);
    const prod = products.find((p) => p.id === poSelectedProdId);
    if (!sup || !prod) return;

    const totalCost = poQty * poCost;
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      brandId: activeBrandId,
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      status: 'ORDERED',
      totalCost,
      items: [
        {
          productId: prod.id,
          title: prod.title,
          orderedQty: poQty,
          receivedQty: 0,
          costPrice: poCost,
          totalCost,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    await db.purchase_orders.add(newPo);
    setIsCreatePoOpen(false);
    loadData();
  };

  // Goods Received Note (GRN) confirmation
  const handleConfirmGrn = async (po: PurchaseOrder) => {
    // 1. Restock products in Dexie
    for (const item of po.items) {
      const prod = await db.products.get(item.productId);
      if (prod) {
        await db.products.update(item.productId, {
          stock: prod.stock + item.orderedQty,
        });
      }
    }

    // 2. Mark PO as RECEIVED
    await db.purchase_orders.update(po.id, {
      status: 'RECEIVED',
      receivedAt: new Date().toISOString(),
    });

    setReceivingPo(null);
    loadData();
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Suppliers & Purchase Orders (PO)
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor catalogs, inward purchase orders, and Goods Received Note (GRN) stock takes.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAddSupplierOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Supplier
              </button>
              <button
                onClick={() => setIsCreatePoOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow"
              >
                <FileText className="w-4 h-4" />
                Create Purchase Order
              </button>
            </div>
          </div>

          {/* Supplier Directory Quick Ribbon */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registered Supplier Network
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-xs text-slate-900">{sup.name}</h4>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {sup.paymentTerms}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {sup.phone} ({sup.contactPerson})
                    </p>
                    {sup.gstin && (
                      <p className="font-mono text-[10px] text-slate-400">GSTIN: {sup.gstin}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Orders Table */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Purchase Order Log & Goods Receiving
            </h2>

            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">PO Number</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Items</th>
                    <th className="p-3.5">Total Cost</th>
                    <th className="p-3.5">Date Created</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">GRN Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No purchase orders recorded yet. Click &quot;Create Purchase Order&quot; above.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">{po.poNumber}</td>
                        <td className="p-3.5 font-medium text-slate-800">{po.supplierName}</td>
                        <td className="p-3.5 text-slate-600">
                          {po.items.map((i) => `${i.title} (x${i.orderedQty})`).join(', ')}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {currency}{po.totalCost.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                          {new Date(po.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                              po.status === 'RECEIVED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          {po.status !== 'RECEIVED' ? (
                            <button
                              onClick={() => handleConfirmGrn(po)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black transition flex items-center gap-1 ml-auto"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Receive Goods
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Restocked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE PURCHASE ORDER MODAL */}
      {isCreatePoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Create Supplier Purchase Order</h3>

            <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Supplier *</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Product to Reorder *</label>
                <select
                  value={poSelectedProdId}
                  onChange={(e) => {
                    setPoSelectedProdId(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) setPoCost(prod.costPrice);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (In Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Ordered Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poQty}
                    onChange={(e) => setPoQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Unit Purchase Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={poCost}
                    onChange={(e) => setPoCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-bold">
                <span>Total PO Cost:</span>
                <span className="font-mono text-slate-900">{currency}{(poQty * poCost).toFixed(2)}</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePoOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow"
                >
                  Confirm Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Add New Supplier</h3>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Wholesale Foods"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supPerson}
                    onChange={(e) => setSupPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Payment Terms</label>
                  <select
                    value={supTerms}
                    onChange={(e) => setSupTerms(e.target.value as 'NET_15' | 'NET_30' | 'COD')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="NET_15">NET 15 Days</option>
                    <option value="NET_30">NET 30 Days</option>
                    <option value="COD">Cash On Delivery (COD)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={supGstin}
                    onChange={(e) => setSupGstin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
