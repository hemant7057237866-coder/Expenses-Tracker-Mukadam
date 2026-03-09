import React, { useState, useEffect } from "react";
import { Plus, Download, Building2, Wallet, X, ArrowDownLeft, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import DeletePinModal from "../components/DeletePinModal";

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
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Dashboard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [sourcesRes, txRes] = await Promise.all([
        fetch("/api/sources"),
        fetch("/api/transactions"),
      ]);
      setSources(await sourcesRes.json());
      setTransactions(await txRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBalance = sources.reduce((sum, s) => sum + (s.balance || 0), 0);

  const handleExportCSV = () => {
    const headers = ["Date", "Type", "Description", "Source", "Amount"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => 
        `${t.date},${t.type},"${t.description || ''}",${t.source_name || '-'},${t.amount}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TOPUP': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'EXPENSE': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'PURCHASE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'VENDOR_PAYMENT': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your financial sources and recent activity.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsSourceModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Source
          </button>
          <button
            onClick={() => {
              setEditTransaction(null);
              setIsFundModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Add Funds
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-2">Total Available Balance</p>
          <h2 className="text-5xl font-semibold text-white tracking-tight">{formatCurrency(totalBalance)}</h2>
        </div>
        <Wallet className="absolute -right-4 -bottom-4 w-48 h-48 text-slate-800/50" strokeWidth={1} />
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map(source => (
          <div key={source.id} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">{source.name}</p>
              <p className="text-2xl font-semibold text-white">{formatCurrency(source.balance || 0)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 bg-slate-800 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>
        
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 bg-slate-900/50">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No recent activity.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", getTypeColor(tx.type))}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">
                        {tx.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                        {tx.source_name || '-'}
                      </td>
                      <td className={cn("px-6 py-4 text-sm font-medium text-right whitespace-nowrap", tx.type === 'TOPUP' ? 'text-emerald-500' : 'text-rose-500')}>
                        {tx.type === 'TOPUP' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {tx.type === 'TOPUP' && (
                            <button 
                              onClick={() => {
                                setEditTransaction(tx);
                                setIsFundModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
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
      {isSourceModalOpen && (
        <NewSourceModal 
          onClose={() => setIsSourceModalOpen(false)} 
          onSuccess={() => {
            setIsSourceModalOpen(false);
            fetchData();
          }} 
        />
      )}
      {isFundModalOpen && (
        <AddFundsModal 
          sources={sources}
          editTransaction={editTransaction}
          onClose={() => {
            setIsFundModalOpen(false);
            setEditTransaction(null);
          }} 
          onSuccess={() => {
            setIsFundModalOpen(false);
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

function NewSourceModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to create source", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">New Source</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Source Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              placeholder="e.g., ICICI Bank, Cash"
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
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddFundsModal({ sources, editTransaction, onClose, onSuccess }: { sources: Source[], editTransaction: Transaction | null, onClose: () => void, onSuccess: () => void }) {
  const [sourceId, setSourceId] = useState(editTransaction?.source_id?.toString() || sources[0]?.id?.toString() || "");
  const [amount, setAmount] = useState(editTransaction?.amount?.toString() || "");
  const [date, setDate] = useState(editTransaction?.date || format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState(editTransaction?.description || "");
  const [loading, setLoading] = useState(false);

  // Update sourceId if sources change and it's empty
  useEffect(() => {
    if (!sourceId && sources.length > 0) {
      setSourceId(sources[0].id.toString());
    }
  }, [sources, sourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !amount || !date) return;
    setLoading(true);
    try {
      const url = editTransaction ? `/api/transactions/${editTransaction.id}` : "/api/transactions";
      const method = editTransaction ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TOPUP",
          source_id: Number(sourceId),
          amount: parseFloat(amount),
          date,
          description,
        }),
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to add funds", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">{editTransaction ? "Edit Funds" : "Add Funds"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Destination Source</label>
              <select
                required
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all appearance-none"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">Select Source</option>
                {sources.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} (Current: {formatCurrency(s.balance || 0)})
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
              placeholder="e.g., Initial Deposit"
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
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : (editTransaction ? "Update Funds" : "Add Funds")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
