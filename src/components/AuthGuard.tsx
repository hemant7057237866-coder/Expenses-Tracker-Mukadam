import React, { useState } from "react";
import { Lock } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("mukadam_auth") === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Shams@Mukadam") {
      localStorage.setItem("mukadam_auth", "true");
      setIsAuthenticated(true);
    } else {
      setError("Incorrect password");
    }
  };

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 text-slate-200 font-sans">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
            <Lock className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Mukadam Royal Arcade</h1>
          <p className="text-slate-400 mt-2">Enter password to access</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-center"
              required
            />
          </div>
          {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg text-sm font-medium text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
          >
            Unlock App
          </button>
        </form>
      </div>
    </div>
  );
}
