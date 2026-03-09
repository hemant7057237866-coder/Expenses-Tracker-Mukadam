import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Download, Edit2, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import DeletePinModal from "../components/DeletePinModal";

type Ledger = { id: number; name: string };
type Source = { id: number; name: string; balance: number };
type Transaction = {
  id: number;
  type: string;
  source_id: number | null;
  ledger_id: number | null;
  vendor_id: number | null;
  source_name: string;
  ledger_name: string;
  amount: number;
  date: string;
  description: string;
};
type ChartData = { name: string; value: number };

const COLORS = ["#F43F5E", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Expenses() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [ledgersRes, sourcesRes, txRes, statsRes] = await Promise.all([
        fetch("/api/ledgers"),
        fetch("/api/sources"),
        fetch("/api/transactions"),
        fetch("/api/expenses/stats"),
      ]);

      setLedgers(await ledgersRes.json());
      setSources(await sourcesRes.json());
      
      const allTx = await txRes.json();
      setTransactions(allTx.filter((t: any) => t.type === 'EXPENSE'));
      
      setChartData(await statsRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    const headers = ["Date", "Ledger", "Source", "Description", "Amount"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => 
        `${t.date},${t.ledger_name},${t.source_name},"${t.description || ''}",${t.amount}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
        <h1 className="text-3xl font-semibold text-white tracking-tight">Expenses</h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsLedgerModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            New Ledger
          </button>
          <button
            onClick={() => {
              setEditTransaction(null);
              setIsExpenseModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
          >
            <Plus className="w-4 h-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Top Section: Chart */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 h-[300px] flex flex-col">
        <h2 className="text-lg font-medium text-white mb-4">Expenses by Ledger</h2>
        <div className="flex-1 min-h-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              No expense data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Expense History</h2>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/50">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Ledger</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No expenses logged yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                      {format(new Date(tx.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1E293B] text-slate-300">
                        {tx.ledger_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                      {tx.source_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">
                      {tx.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white text-right whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditTransaction(tx);
                            setIsExpenseModalOpen(true);
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

      {/* Modals */}
      {isLedgerModalOpen && (
        <NewLedgerModal 
          onClose={() => setIsLedgerModalOpen(false)} 
          onSuccess={() => {
            setIsLedgerModalOpen(false);
            fetchData();
          }} 
        />
      )}
      {isExpenseModalOpen && (
        <LogExpenseModal 
          ledgers={ledgers}
          sources={sources}
          editTransaction={editTransaction}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditTransaction(null);
          }} 
          onSuccess={() => {
            setIsExpenseModalOpen(false);
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

function NewLedgerModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to create ledger", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">New Ledger</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Ledger Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
              placeholder="e.g., Marketing, Travel"
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
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Ledger"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LogExpenseModal({ ledgers, sources, editTransaction, onClose, onSuccess }: { ledgers: Ledger[], sources: Source[], editTransaction: Transaction | null, onClose: () => void, onSuccess: () => void }) {
  const [ledgerId, setLedgerId] = useState(editTransaction?.ledger_id?.toString() || ledgers[0]?.id?.toString() || "");
  const [sourceId, setSourceId] = useState(editTransaction?.source_id?.toString() || sources[0]?.id?.toString() || "");
  const [amount, setAmount] = useState(editTransaction?.amount?.toString() || "");
  const [date, setDate] = useState(editTransaction?.date || format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState(editTransaction?.description || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ledgerId && ledgers.length > 0) setLedgerId(ledgers[0].id.toString());
    if (!sourceId && sources.length > 0) setSourceId(sources[0].id.toString());
  }, [ledgers, sources, ledgerId, sourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerId || !sourceId || !amount || !date) return;
    setLoading(true);
    try {
      const url = editTransaction ? `/api/transactions/${editTransaction.id}` : "/api/transactions";
      const method = editTransaction ? "PUT" : "POST";
      
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXPENSE",
          ledger_id: Number(ledgerId),
          source_id: Number(sourceId),
          amount: parseFloat(amount),
          date,
          description,
        }),
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to log expense", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">{editTransaction ? "Edit Expense" : "Log Expense"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Ledger Category</label>
              <select
                required
                value={ledgerId}
                onChange={(e) => setLedgerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all appearance-none"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">Select Ledger</option>
                {ledgers.map(l => (
                  <option key={l.id} value={l.id} className="bg-slate-900 text-white">{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Payment Source</label>
              <select
                required
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all appearance-none"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all resize-none"
              placeholder="What was this expense for?"
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
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : (editTransaction ? "Update Expense" : "Log Expense")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
