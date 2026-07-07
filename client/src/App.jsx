import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import PageLoader from "./components/ui/PageLoader";
import Login from "./pages/auth/Login";

const Register = lazy(() => import("./pages/auth/Register"));
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const ICTDashboard = lazy(() => import("./pages/dashboard/ICTDashboard"));
const StudentDashboardFixed = lazy(() => import("./pages/dashboard/StudentDashboardFixed"));
const TicketList = lazy(() => import("./pages/tickets/TicketList"));
const CreateTicket = lazy(() => import("./pages/tickets/CreateTicket"));
const TicketDetail = lazy(() => import("./pages/tickets/TicketDetail"));
const KnowledgeBase = lazy(() => import("./pages/knowledge/KnowledgeBase"));
const ArticleDetail = lazy(() => import("./pages/knowledge/ArticleDetail"));
const AssetList = lazy(() => import("./pages/assets/AssetList"));
const AssetDetail = lazy(() => import("./pages/assets/AssetDetail"));
const Reports = lazy(() => import("./pages/reports/Reports"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AccountSettings = lazy(() => import("./pages/account/AccountSettings"));

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    toast.error("Not authorized");
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const DashboardRouter = () => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "ict_officer") return <ICTDashboard />;
  return <StudentDashboardFixed />;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader label="Loading application..." />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<DashboardRouter />} />
            <Route path="tickets" element={<TicketList />} />
            <Route path="tickets/create" element={<CreateTicket />} />
            <Route path="tickets/new" element={<CreateTicket />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="knowledge/:id" element={<ArticleDetail />} />
            <Route path="assets" element={<ProtectedRoute roles={["admin", "ict_officer"]}><AssetList /></ProtectedRoute>} />
            <Route path="assets/:id" element={<ProtectedRoute roles={["admin", "ict_officer"]}><AssetDetail /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute roles={["admin", "ict_officer"]}><Reports /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute roles={["admin"]}><UserManagement /></ProtectedRoute>} />
            <Route path="account-settings" element={<AccountSettings />} />
            <Route path="manage-accounts" element={<Navigate to="/account-settings" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
