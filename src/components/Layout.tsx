import { Outlet, NavLink } from "react-router-dom";
import { Wallet, LayoutDashboard, Receipt, Users } from "lucide-react";
import { cn } from "../lib/utils";

export default function Layout() {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#020617] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-[#0B1120] border-r border-slate-800 flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Wallet className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white leading-tight">Mukadam Royal Arcade</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#1E1B16] text-amber-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </NavLink>
          <NavLink
            to="/expenses"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#1E1B16] text-amber-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )
            }
          >
            <Receipt className="w-5 h-5" />
            Expenses
          </NavLink>
          <NavLink
            to="/vendors"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#1E1B16] text-amber-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )
            }
          >
            <Users className="w-5 h-5" />
            Vendors
          </NavLink>
        </nav>
      </aside>

      {/* Header (Mobile) */}
      <header className="md:hidden bg-[#0B1120] border-b border-slate-800 p-4 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
          <Wallet className="w-5 h-5 text-slate-950" />
        </div>
        <h1 className="text-base font-semibold tracking-tight text-white leading-tight">Mukadam Royal Arcade</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1120] border-t border-slate-800 flex justify-around items-center p-2 z-50">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors",
              isActive
                ? "text-amber-500"
                : "text-slate-400 hover:text-slate-200"
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors",
              isActive
                ? "text-amber-500"
                : "text-slate-400 hover:text-slate-200"
            )
          }
        >
          <Receipt className="w-5 h-5" />
          Expenses
        </NavLink>
        <NavLink
          to="/vendors"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors",
              isActive
                ? "text-amber-500"
                : "text-slate-400 hover:text-slate-200"
            )
          }
        >
          <Users className="w-5 h-5" />
          Vendors
        </NavLink>
      </nav>
    </div>
  );
}
