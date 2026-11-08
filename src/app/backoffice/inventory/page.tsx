'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { Product } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { translations } from '@/lib/i18n';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';
import { ImageFileInput } from '@/components/common/ImageFileInput';
import { generateCompliantBarcode } from '@/utils/barcodeUtils';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  Barcode,
  Layers,
  ArrowUpDown,
  Check,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function InventoryPage() {
  const { activeBrandId, currency, language } = usePosStore();
  const { planName, limits } = usePlanAccess(activeBrandId);
  const { isAdmin, isStaff } = useRoleAccess();
  const t = translations[language];

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isPlanGateOpen, setIsPlanGateOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Snacks');
  const [formCost, setFormCost] = useState(0);
  const [formMrp, setFormMrp] = useState(0);
  const [formPrice, setFormPrice] = useState(0);
  const [formTax, setFormTax] = useState(5);
  const [formStock, setFormStock] = useState(0);
  const [formLowThreshold, setFormLowThreshold] = useState(10);
  const [formImage, setFormImage] = useState('');

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState<'RESTOCK' | 'DAMAGE' | 'EXPIRY'>('RESTOCK');

  const loadProducts = async () => {
    const list = await db.products.toArray();
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, [activeBrandId]);

  const generateBarcode = () => {
    setFormBarcode(generateCompliantBarcode('EAN13'));
  };

  const isLimitReached = limits.products !== null && products.length >= limits.products;

  const handleOpenAdd = () => {
    if (!isAdmin) {
      alert('Permission Denied: Staff accounts cannot add products. Contact your Store Administrator.');
      return;
    }
    if (isLimitReached) {
      setIsPlanGateOpen(true);
      return;
    }
    setEditingProduct(null);
    setFormTitle('');
    generateBarcode();
    setFormSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
    setFormCategory('Snacks');
    setFormCost(15);
    setFormMrp(30);
    setFormPrice(25);
    setFormTax(5);
    setFormStock(25);
    setFormLowThreshold(10);
    setFormImage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    if (!isAdmin) {
      alert('Permission Denied: Staff accounts cannot edit products. Contact your Store Administrator.');
      return;
    }
    setEditingProduct(p);
    setFormTitle(p.title);
    setFormBarcode(p.barcode);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormCost(p.costPrice);
    setFormMrp(p.mrp);
    setFormPrice(p.sellingPrice);
    setFormTax(p.taxRate);
    setFormStock(p.stock);
    setFormLowThreshold(p.lowStockThreshold);
    setFormImage(p.image || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Permission Denied: Staff accounts cannot add or edit products.');
      return;
    }
    if (!formTitle.trim() || !formBarcode.trim()) return;

    if (editingProduct) {
      await db.products.update(editingProduct.id, {
        title: formTitle.trim(),
        barcode: formBarcode.trim(),
        sku: formSku.trim(),
        category: formCategory,
        costPrice: Number(formCost),
        mrp: Number(formMrp),
        sellingPrice: Number(formPrice),
        taxRate: Number(formTax),
        stock: Number(formStock),
        lowStockThreshold: Number(formLowThreshold),
        image: formImage.trim() || undefined,
      });
    } else {
      if (isLimitReached) {
        setIsPlanGateOpen(true);
        return;
      }
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        brandId: activeBrandId,
        barcode: formBarcode.trim(),
        sku: formSku.trim(),
        title: formTitle.trim(),
        brand: 'Store Brand',
        category: formCategory,
        unit: 'Pcs',
        costPrice: Number(formCost),
        mrp: Number(formMrp),
        sellingPrice: Number(formPrice),
        taxRate: Number(formTax),
        stock: Number(formStock),
        lowStockThreshold: Number(formLowThreshold),
        image: formImage.trim() || undefined,
        isActive: true,
      };
      await db.products.add(newProd);
    }

    setIsModalOpen(false);
    loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin) {
      alert('Permission Denied: Staff accounts cannot delete products.');
      return;
    }
    if (confirm('Are you sure you want to delete this product?')) {
      await db.products.delete(id);
      loadProducts();
    }
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Permission Denied: Staff accounts cannot adjust stock. Contact your Store Administrator.');
      return;
    }
    if (!adjustingProduct) return;

    let newStock = adjustingProduct.stock;
    if (adjustReason === 'RESTOCK') {
      newStock += Number(adjustQty);
    } else {
      newStock = Math.max(0, newStock - Number(adjustQty));
    }

    await db.products.update(adjustingProduct.id, { stock: newStock });
    setAdjustingProduct(null);
    loadProducts();
  };

  const categories = ['All', 'Snacks', 'Beverages', 'Dairy', 'Bakery', 'Apparel', 'Restaurant'];

  const filtered = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !lowStockOnly || p.stock <= p.lowStockThreshold;
    return matchesCategory && matchesSearch && matchesLowStock;
  });

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Limit Reached Warning Alert */}
          {isLimitReached && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Product Catalog Limit Reached ({products.length}/{limits.products}):</strong> You have reached the maximum catalog size allowed on the Starter plan.
                </span>
              </div>
              <button
                onClick={() => setIsPlanGateOpen(true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shrink-0"
              >
                Upgrade Plan
              </button>
            </div>
          )}

          {/* Top Title & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Inventory & Stock Management
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage SKUs, automated barcode generation, pricing tiers, and physical stocktakes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Product Catalog Usage Badge */}
              <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Catalog:</span>
                <strong className="font-mono text-slate-900">
                  {products.length} {limits.products !== null ? `/ ${limits.products}` : 'Products'}
                </strong>
                {limits.products === null ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-black px-2 py-0.5 rounded-full uppercase">
                    Unlimited
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      isLimitReached
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isLimitReached ? 'Limit Reached' : `${limits.products - products.length} left`}
                  </span>
                )}
              </div>

              {isAdmin ? (
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addProduct}</span>
                </button>
              ) : (
                <div
                  title="Restricted: Only Store Administrators can add products"
                  className="px-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none self-start sm:self-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.addProduct} (Admin Only)</span>
                </div>
              )}
            </div>
          </div>

          {/* Role Mode Banner for Staff */}
          {isStaff && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-2 text-xs text-amber-900 shadow-xs">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Store Staff Mode (Read-Only):</strong> Staff associates can search the catalog and check stock levels. Adding, editing, or deleting products is restricted to Store Administrators.
              </span>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Category Selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Low Stock Toggle Switch */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                Low Stock Only
              </span>
            </label>
          </div>

          {/* Product Data Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Product Details</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Barcode</th>
                    <th className="p-3.5">Cost Price</th>
                    <th className="p-3.5">Selling Price</th>
                    <th className="p-3.5">GST Rate</th>
                    <th className="p-3.5">Stock in Hand</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400 text-xs">
                        No products found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((prod) => {
                      const isLowStock = prod.stock <= prod.lowStockThreshold && prod.stock > 0;
                      const isOutOfStock = prod.stock === 0;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3.5 pl-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                {prod.image && (
                                  <img
                                    src={prod.image}
                                    alt={prod.title}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-xs block leading-tight">
                                  {prod.title}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  SKU: {prod.sku}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-600">{prod.category}</td>
                          <td className="p-3.5 font-mono text-slate-600 font-semibold">{prod.barcode}</td>
                          <td className="p-3.5 font-mono text-slate-500">{currency}{prod.costPrice.toFixed(2)}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-900">{currency}{prod.sellingPrice.toFixed(2)}</td>
                          <td className="p-3.5 font-mono text-slate-600">{prod.taxRate}%</td>
                          <td className="p-3.5">
                            {isOutOfStock ? (
                              <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="bg-amber-50 text-amber-800 font-extrabold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 w-max">
                                <AlertTriangle className="w-3 h-3" />
                                {prod.stock} (Low!)
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                                {prod.stock} in stock
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 pr-5 text-right space-x-1.5">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => setAdjustingProduct(prod)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                                  title="Adjust Stock"
                                >
                                  Stock +/-
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(prod)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span
                                title="Product modifications and deletions restricted to Store Administrators"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg"
                              >
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Read Only</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Edit Product SKU' : 'Add New Retail Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} autoComplete="off" className="p-6 space-y-3.5 flex-1 overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Organic Almond Milk 1L"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Barcode *</label>
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className="text-[10px] text-teal-600 font-bold hover:underline"
                    >
                      Auto-generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Number</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formTax}
                    onChange={(e) => setFormTax(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock in Hand</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low-Stock Alert</label>
                  <input
                    type="number"
                    value={formLowThreshold}
                    onChange={(e) => setFormLowThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <ImageFileInput
                value={formImage}
                onChange={setFormImage}
                label="Product Image (Upload from Files or Link)"
              />

              <div className="pt-3 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow"
                >
                  Save Product Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Physical Stock Adjustment</h3>
              <p className="text-xs text-slate-500 mt-0.5">{adjustingProduct.title}</p>
            </div>

            <form onSubmit={handleStockAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Adjustment Type</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as 'RESTOCK' | 'DAMAGE' | 'EXPIRY')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="RESTOCK">Restock / Add Inward Stock (+)</option>
                  <option value="DAMAGE">Damaged / Broken Scrap (-)</option>
                  <option value="EXPIRY">Expired Product Disposal (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-0.5">
                <div className="flex justify-between">
                  <span>Current Stock:</span>
                  <strong>{adjustingProduct.stock}</strong>
                </div>
                <div className="flex justify-between font-bold text-teal-700">
                  <span>After Adjustment:</span>
                  <strong>
                    {adjustReason === 'RESTOCK'
                      ? adjustingProduct.stock + adjustQty
                      : Math.max(0, adjustingProduct.stock - adjustQty)}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow"
                >
                  Confirm Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Gate Modal for Product Limits */}
      <PlanGateModal
        isOpen={isPlanGateOpen}
        onClose={() => setIsPlanGateOpen(false)}
        title="Product Catalog Limit Reached"
        description="Your store has reached the maximum 1,000 product catalog limit allowed on the Starter plan. Upgrade to Professional for unlimited products, advanced inventory batching, and automated restock orders."
        requiredPlan="Professional"
        currentPlan={planName}
      />
    </div>
  );
}
