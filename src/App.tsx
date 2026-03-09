import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Vendors from "./pages/Vendors";
import AuthGuard from "./components/AuthGuard";

export default function App() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/expenses" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="vendors" element={<Vendors />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
}
