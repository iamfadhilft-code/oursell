'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { Supplier, PurchaseOrder, Product } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { LockedFeatureScreen } from '@/components/pricing/LockedFeatureScreen';
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
  Edit2,
  Trash2,
  Shield,
  ShieldAlert,
  AlertCircle,
  MapPin,
  Lock,
} from 'lucide-react';

export default function PurchasingPage() {
  const { activeBrandId, currency } = usePosStore();
  const { isAdmin, isStaff, canManageSuppliers, roleBadge } = useRoleAccess();
  const { planName, checkFeature } = usePlanAccess(activeBrandId);
  const purchaseFeature = checkFeature('purchase_orders');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);

  // Supplier Form State
  const [supName, setSupName] = useState('');
  const [supPerson, setSupPerson] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supTerms, setSupTerms] = useState<'NET_15' | 'NET_30' | 'COD'>('NET_30');

  // New PO Form
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poSelectedProdId, setPoSelectedProdId] = useState('');
  const [poQty, setPoQty] = useState(50);
  const [poCost, setPoCost] = useState(20);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

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

  // Open Edit Supplier Modal
  const handleOpenEditSupplier = (sup: Supplier) => {
    if (!canManageSuppliers) {
      alert('Restricted: Only Store Administrators can edit suppliers.');
      return;
    }
    setEditingSupplier(sup);
    setSupName(sup.name);
    setSupPerson(sup.contactPerson || '');
    setSupPhone(sup.phone || '');
    setSupEmail(sup.email || '');
    setSupGstin(sup.gstin || '');
    setSupAddress(sup.address || '');
    setSupTerms(sup.paymentTerms || 'NET_30');
    setIsEditSupplierOpen(true);
  };

  // Open Add Supplier Modal
  const handleOpenAddSupplier = () => {
    if (!canManageSuppliers) {
      alert('Restricted: Only Store Administrators can add new suppliers.');
      return;
    }
    setEditingSupplier(null);
    setSupName('');
    setSupPerson('');
    setSupPhone('');
    setSupEmail('');
    setSupGstin('');
    setSupAddress('');
    setSupTerms('NET_30');
    setIsAddSupplierOpen(true);
  };

  // Save new supplier (Admin Only)
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSuppliers) return;
    if (!supName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      brandId: activeBrandId,
      name: supName.trim(),
      contactPerson: supPerson.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim() || undefined,
      gstin: supGstin.trim() || undefined,
      address: supAddress.trim() || undefined,
      paymentTerms: supTerms,
    };

    await db.suppliers.put(newSup);
    setSuppliers((prev) => [newSup, ...prev]);
    setIsAddSupplierOpen(false);
    showNotification(`Supplier "${newSup.name}" added successfully.`);
    loadData();
  };

  // Update existing supplier (Admin Only)
  const handleSaveSupplierEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSuppliers || !editingSupplier) return;
    if (!supName.trim()) return;

    const updatedSup: Supplier = {
      ...editingSupplier,
      name: supName.trim(),
      contactPerson: supPerson.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim() || undefined,
      gstin: supGstin.trim() || undefined,
      address: supAddress.trim() || undefined,
      paymentTerms: supTerms,
    };

    await db.suppliers.put(updatedSup);
    setSuppliers((prev) => prev.map((s) => (s.id === updatedSup.id ? updatedSup : s)));
    setIsEditSupplierOpen(false);
    setEditingSupplier(null);
    showNotification(`Supplier "${supName.trim()}" updated successfully.`);
  };

  // Delete supplier confirmation
  const handleConfirmDeleteSupplier = async () => {
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot delete suppliers.');
      return;
    }
    if (!supplierToDelete) return;
    const supId = supplierToDelete.id;
    const supTitle = supplierToDelete.name;

    await db.suppliers.delete(supId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supId));
    setSupplierToDelete(null);
    showNotification(`Supplier "${supTitle}" deleted.`);
  };

  // Delete Purchase Order confirmation
  const handleConfirmDeletePo = async () => {
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot delete purchase orders.');
      return;
    }
    if (!poToDelete) return;
    const pId = poToDelete.id;
    const pNum = poToDelete.poNumber;

    await db.purchase_orders.delete(pId);
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== pId));
    setPoToDelete(null);
    showNotification(`Purchase Order "${pNum}" removed.`);
  };

  // Create PO
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot create purchase orders.');
      return;
    }
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
    showNotification(`Purchase Order ${newPo.poNumber} created.`);
    loadData();
  };

  // Goods Received Note (GRN) confirmation (STAFF & ADMIN CAN DO THIS WORK)
  const handleConfirmGrn = async (po: PurchaseOrder) => {
    for (const item of po.items) {
      const prod = await db.products.get(item.productId);
      if (prod) {
        await db.products.update(item.productId, {
          stock: prod.stock + item.orderedQty,
        });
      }
    }

    await db.purchase_orders.update(po.id, {
      status: 'RECEIVED',
      receivedAt: new Date().toISOString(),
    });

    showNotification(`GRN Received! Restocked items for PO ${po.poNumber}.`);
    loadData();
  };

  if (!purchaseFeature.allowed) {
    return (
      <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
        <PosSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <PosHeader />
          <LockedFeatureScreen
            featureName="Purchase Orders & Supplier Management"
            featureDescription="Automate inventory restocks, manage vendor directories, payment terms (Net-30/COD), and track incoming purchase orders with one-click stock replenishment."
            requiredPlan="Professional"
            currentPlan={planName}
            storeSlug={activeBrandId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        {/* Status Toast */}
        {notice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Page Top Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Suppliers & Purchase Orders (PO)
                </h1>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    isAdmin
                      ? 'bg-slate-900 text-white'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  {roleBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Full administrative control: Add, edit, and delete suppliers, manage vendor terms and purchase orders.'
                  : 'Staff operational portal: Receive inward shipments (GRN), restock store inventory, and review PO status.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {canManageSuppliers ? (
                <button
                  onClick={handleOpenAddSupplier}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  + Add Supplier
                </button>
              ) : (
                <div
                  title="Restricted: Only Store Administrators can add or edit suppliers"
                  className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-not-allowed border border-slate-200"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Supplier Edits Restricted (Admin Only)
                </div>
              )}

              {isAdmin ? (
                <button
                  onClick={() => setIsCreatePoOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  Create PO
                </button>
              ) : (
                <div
                  title="Restricted: Only Store Administrators can create purchase orders"
                  className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-not-allowed border border-slate-200"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Create PO (Admin Only)
                </div>
              )}
            </div>
          </div>

          {/* Role Mode Banner for Staff */}
          {isStaff && (
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-teal-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Staff Operational Duty:</strong> You can inspect vendor details and receive deliveries (GRN) to update physical store stock. Supplier additions, edits, and deletions require Admin login.
                </span>
              </div>
            </div>
          )}

          {/* Supplier Directory Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Registered Supplier Network ({suppliers.length})
              </h2>
              {canManageSuppliers && (
                <span className="text-[11px] text-teal-700 font-semibold">
                  Admin Edit & Delete Privileges Active
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 hover:border-slate-300 transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{sup.name}</h4>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 inline-block mt-1">
                        {sup.paymentTerms}
                      </span>
                    </div>

                    {/* Admin Actions: Edit & Delete */}
                    {canManageSuppliers ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditSupplier(sup)}
                          className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                          title="Edit Supplier Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSupplierToDelete(sup)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        title="Supplier record protected by Store Administrator"
                        className="p-1 text-slate-300"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{sup.phone}</span>
                      {sup.contactPerson && (
                        <span className="text-slate-400 font-medium">({sup.contactPerson})</span>
                      )}
                    </p>
                    {sup.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.email}</span>
                      </p>
                    )}
                    {sup.address && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.address}</span>
                      </p>
                    )}
                    {sup.gstin && (
                      <p className="font-mono text-[10px] text-slate-400 pt-0.5">
                        GSTIN: <span className="font-bold text-slate-600">{sup.gstin}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Orders Table */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
              Purchase Order Log & Goods Receiving (GRN)
            </h2>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">PO Number</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Items</th>
                    <th className="p-3.5">Total Cost</th>
                    <th className="p-3.5">Date Created</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Inward Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No purchase orders recorded yet.
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
                        <td className="p-3.5 pr-5 text-right flex items-center justify-end gap-2">
                          {po.status !== 'RECEIVED' ? (
                            <button
                              onClick={() => handleConfirmGrn(po)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black transition flex items-center gap-1 shadow-xs"
                              title="Staff or Admin can restock store inventory upon shipment arrival"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Receive Goods (GRN)
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Restocked
                            </span>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setPoToDelete(po)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Purchase Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Create Supplier Purchase Order</h3>
              <button
                onClick={() => setIsCreatePoOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                      {p.title} (Current Stock: {p.stock})
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

              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-bold border border-slate-100">
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

      {/* ADD SUPPLIER MODAL (Admin Only) */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Add New Supplier (Admin)</h3>
              </div>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Wholesale Foods"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 font-semibold"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Payment Terms</label>
                  <select
                    value={supTerms}
                    onChange={(e) => setSupTerms(e.target.value as 'NET_15' | 'NET_30' | 'COD')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
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

              <div>
                <label className="block font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Warehouse / Office Address</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                  className="flex-[2] py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUPPLIER MODAL (Admin Only) */}
      {isEditSupplierOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Edit Supplier (Admin)</h3>
              </div>
              <button
                onClick={() => setIsEditSupplierOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplierEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 font-bold text-slate-900"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Payment Terms</label>
                  <select
                    value={supTerms}
                    onChange={(e) => setSupTerms(e.target.value as 'NET_15' | 'NET_30' | 'COD')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
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

              <div>
                <label className="block font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Warehouse / Office Address</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditSupplierOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DELETE SUPPLIER CONFIRM MODAL */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Delete Supplier?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete supplier <strong className="text-slate-800">&quot;{supplierToDelete.name}&quot;</strong>?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSupplier}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PO CONFIRM MODAL */}
      {poToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Cancel Purchase Order?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove purchase order <strong className="text-slate-800">{poToDelete.poNumber}</strong> ({poToDelete.supplierName})?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPoToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Keep PO
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePo}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
