import React, { useState, useEffect } from "react";
import { Plus, Download, Users, ShoppingCart, CreditCard, X, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import DeletePinModal from "../components/DeletePinModal";

type Vendor = { id: number; name: string; pending_payable: number };
type Source = { id: number; name: string; balance: number };
type Transaction = {
  id: number;
  type: string;
  source_id: number | null;
  ledger_id: number | null;
  vendor_id: number | null;
  source_name: string;
  ledger_name: string;
  vendor_name: string;
  amount: number;
  date: string;
  description: string;
  is_credit: number;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [vendorsRes, sourcesRes, txRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch("/api/sources"),
        fetch("/api/transactions"),
      ]);
      setVendors(await vendorsRes.json());
      setSources(await sourcesRes.json());
      
      const allTx = await txRes.json();
      setTransactions(allTx.filter((t: any) => t.type === 'PURCHASE' || t.type === 'VENDOR_PAYMENT'));
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    const headers = ["Date", "Type", "Vendor", "Source/Status", "Description", "Amount"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => {
        const status = t.type === 'PURCHASE' && t.is_credit ? 'On Credit' : (t.source_name || '-');
        return `${t.date},${t.type},${t.vendor_name},${status},"${t.description || ''}",${t.amount}`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vendors_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/transactions/${deleteId}`, { method: "DELETE" });
      fetchData();
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Vendors</h1>
          <p className="text-slate-400 mt-1">Manage suppliers, purchases, and payables.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Vendor
          </button>
          <button
            onClick={() => {
              setEditTransaction(null);
              setIsPurchaseModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            <ShoppingCart className="w-4 h-4" />
            Record Purchase
          </button>
          <button
            onClick={() => {
              setEditTransaction(null);
              setIsPaymentModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <CreditCard className="w-4 h-4" />
            Pay Vendor
          </button>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map(vendor => (
          <div key={vendor.id} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Vendor
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-4">{vendor.name}</h3>
              <p className="text-slate-400 text-sm mb-1">Pending Payable</p>
              <p className={cn("text-2xl font-semibold", vendor.pending_payable > 0 ? "text-rose-500" : "text-emerald-500")}>
                {formatCurrency(vendor.pending_payable || 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Purchase & Payment History</h2>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 bg-slate-800 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 bg-slate-900/50">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Source / Status</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No purchases or payments yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                          tx.type === 'VENDOR_PAYMENT' 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {tx.type === 'VENDOR_PAYMENT' ? 'Payment' : 'Purchase'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
                        {tx.vendor_name}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {tx.type === 'PURCHASE' && tx.is_credit ? (
                          <span className="flex items-center gap-1.5 text-rose-500">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            On Credit
                          </span>
                        ) : (
                          <span className="text-slate-400">{tx.source_name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">
                        {tx.description || '-'}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-sm font-medium text-right whitespace-nowrap",
                        tx.type === 'VENDOR_PAYMENT' ? "text-emerald-500" : "text-white"
                      )}>
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditTransaction(tx);
                              if (tx.type === 'PURCHASE') {
                                setIsPurchaseModalOpen(true);
                              } else {
                                setIsPaymentModalOpen(true);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(tx.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isVendorModalOpen && (
        <NewVendorModal 
          onClose={() => setIsVendorModalOpen(false)} 
          onSuccess={() => {
            setIsVendorModalOpen(false);
            fetchData();
          }} 
        />
      )}
      {isPurchaseModalOpen && (
        <RecordPurchaseModal 
          vendors={vendors}
          sources={sources}
          editTransaction={editTransaction}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setEditTransaction(null);
          }} 
          onSuccess={() => {
            setIsPurchaseModalOpen(false);
            setEditTransaction(null);
            fetchData();
          }} 
        />
      )}
      {isPaymentModalOpen && (
        <PayVendorModal 
          vendors={vendors}
          sources={sources}
          editTransaction={editTransaction}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setEditTransaction(null);
          }} 
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setEditTransaction(null);
            fetchData();
          }} 
        />
      )}
      {deleteId && (
        <DeletePinModal 
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function NewVendorModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to create vendor", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">New Vendor</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Vendor Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="e.g., AWS, WeWork"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecordPurchaseModal({ vendors, sources, editTransaction, onClose, onSuccess }: { vendors: Vendor[], sources: Source[], editTransaction: Transaction | null, onClose: () => void, onSuccess: () => void }) {
  const [vendorId, setVendorId] = useState(editTransaction?.vendor_id?.toString() || vendors[0]?.id?.toString() || "");
  const [isCredit, setIsCredit] = useState(editTransaction ? !!editTransaction.is_credit : true);
  const [sourceId, setSourceId] = useState(editTransaction?.source_id?.toString() || sources[0]?.id?.toString() || "");
  const [amount, setAmount] = useState(editTransaction?.amount?.toString() || "");
  const [date, setDate] = useState(editTransaction?.date || format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState(editTransaction?.description || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vendorId && vendors.length > 0) setVendorId(vendors[0].id.toString());
    if (!sourceId && sources.length > 0) setSourceId(sources[0].id.toString());
  }, [vendors, sources, vendorId, sourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !amount || !date) return;
    if (!isCredit && !sourceId) return;
    
    setLoading(true);
    try {
      const url = editTransaction ? `/api/transactions/${editTransaction.id}` : "/api/transactions";
      const method = editTransaction ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PURCHASE",
          vendor_id: Number(vendorId),
          source_id: isCredit ? null : Number(sourceId),
          amount: parseFloat(amount),
          date,
          description,
          is_credit: isCredit,
        }),
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to record purchase", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">{editTransaction ? "Edit Purchase" : "Record Purchase"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Vendor</label>
            <select
              required
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">Select Vendor</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">{v.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCredit}
                onChange={(e) => setIsCredit(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-blue-500 focus:ring-blue-500/50 bg-slate-900"
              />
              <span className="text-sm font-medium text-white">Purchase on Credit (Pay Later)</span>
            </label>
            
            {!isCredit && (
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Pay From Source</label>
                <select
                  required
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">Select Source</option>
                  {sources.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.name} (Balance: {formatCurrency(s.balance || 0)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              placeholder="What did you purchase?"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : (editTransaction ? "Update Purchase" : "Record Purchase")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PayVendorModal({ vendors, sources, editTransaction, onClose, onSuccess }: { vendors: Vendor[], sources: Source[], editTransaction: Transaction | null, onClose: () => void, onSuccess: () => void }) {
  const [vendorId, setVendorId] = useState(editTransaction?.vendor_id?.toString() || vendors[0]?.id?.toString() || "");
  const [sourceId, setSourceId] = useState(editTransaction?.source_id?.toString() || sources[0]?.id?.toString() || "");
  const [amount, setAmount] = useState(editTransaction?.amount?.toString() || "");
  const [date, setDate] = useState(editTransaction?.date || format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState(editTransaction?.description || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vendorId && vendors.length > 0) setVendorId(vendors[0].id.toString());
    if (!sourceId && sources.length > 0) setSourceId(sources[0].id.toString());
  }, [vendors, sources, vendorId, sourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !sourceId || !amount || !date) return;
    
    setLoading(true);
    try {
      const url = editTransaction ? `/api/transactions/${editTransaction.id}` : "/api/transactions";
      const method = editTransaction ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VENDOR_PAYMENT",
          vendor_id: Number(vendorId),
          source_id: Number(sourceId),
          amount: parseFloat(amount),
          date,
          description,
        }),
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to pay vendor", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = vendors.find(v => v.id === Number(vendorId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">{editTransaction ? "Edit Payment" : "Pay Vendor"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Vendor</label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-white">{v.name}</option>
                ))}
              </select>
              {selectedVendor && (
                <p className="text-xs text-slate-500 mt-2">
                  Pending: <span className={selectedVendor.pending_payable > 0 ? "text-rose-500" : "text-emerald-500"}>{formatCurrency(selectedVendor.pending_payable)}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Pay From Source</label>
              <select
                required
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">Select Source</option>
                {sources.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} ({formatCurrency(s.balance || 0)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
              placeholder="Payment details"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : (editTransaction ? "Update Payment" : "Pay Vendor")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
