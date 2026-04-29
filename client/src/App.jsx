import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DashboardLayout from "./components/layout/DashboardLayout";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import ICTDashboard from "./pages/dashboard/ICTDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import TicketList from "./pages/tickets/TicketList";
import CreateTicket from "./pages/tickets/CreateTicket";
import TicketDetail from "./pages/tickets/TicketDetail";
import KnowledgeBase from "./pages/knowledge/KnowledgeBase";
import ArticleDetail from "./pages/knowledge/ArticleDetail";
import AssetList from "./pages/assets/AssetList";
import AssetDetail from "./pages/assets/AssetDetail";
import Reports from "./pages/reports/Reports";
import UserManagement from "./pages/admin/UserManagement";

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const DashboardRouter = () => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "ict_officer") return <ICTDashboard />;
  return <StudentDashboard />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardRouter />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/create" element={<CreateTicket />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="knowledge/:id" element={<ArticleDetail />} />
          <Route path="assets" element={<ProtectedRoute roles={["admin", "ict_officer"]}><AssetList /></ProtectedRoute>} />
          <Route path="assets/:id" element={<ProtectedRoute roles={["admin", "ict_officer"]}><AssetDetail /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute roles={["admin", "ict_officer"]}><Reports /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute roles={["admin"]}><UserManagement /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
