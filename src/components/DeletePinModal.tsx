import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export default function DeletePinModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "415709") {
      onConfirm();
    } else {
      setError("Incorrect PIN");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Confirm Deletion
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-400">Enter authorization PIN to delete this record.</p>
          <div>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(""); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all text-center tracking-widest"
              placeholder="••••••"
              maxLength={6}
            />
          </div>
          {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors">Delete</button>
          </div>
        </form>
      </div>
    </div>
  );
}
