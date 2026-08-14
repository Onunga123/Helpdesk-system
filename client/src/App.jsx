import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import PageLoader from "./components/ui/PageLoader";
import Login from "./pages/auth/Login";

const isCareersPortal = import.meta.env.VITE_CAREERS_PORTAL === "true";

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
const HRPortalLayout = lazy(() => import("./components/layout/HRPortalLayout"));
const JobPostingsList = lazy(() => import("./pages/recruitment/JobPostingsList"));
const ApplicantsList = lazy(() => import("./pages/recruitment/ApplicantsList"));
const InterviewsList = lazy(() => import("./pages/recruitment/InterviewsList"));
const OffersList = lazy(() => import("./pages/recruitment/OffersList"));
const ApplicantPortalLayout = lazy(() => import("./components/layout/ApplicantPortalLayout"));
const ApplicantAuth = lazy(() => import("./pages/recruitment/ApplicantAuth"));
const BrowseJobs = lazy(() => import("./pages/recruitment/BrowseJobs"));
const MyApplications = lazy(() => import("./pages/recruitment/MyApplications"));
const ApplicantProfile = lazy(() => import("./pages/recruitment/ApplicantProfile"));
const JobApplication = lazy(() => import("./pages/recruitment/JobApplication"));
const AnalyticsDashboard = lazy(() => import("./pages/recruitment/AnalyticsDashboard"));

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
  if (user.role === "hr_officer") return <Navigate to="/hr-portal/jobs" replace />;
  return <StudentDashboardFixed />;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader label="Loading application..." />}>
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={isCareersPortal ? "/recruitment/browse" : "/dashboard"}
                replace
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recruitment/auth" element={<ApplicantAuth />} />
          <Route path="/recruitment" element={<ApplicantPortalLayout />}>
            <Route index element={<Navigate to="browse" replace />} />
            <Route path="browse" element={<BrowseJobs />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="profile" element={<ApplicantProfile />} />
            <Route path="apply/:jobId" element={<JobApplication />} />
          </Route>
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
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
            <Route
              path="hr-portal"
              element={
                <ProtectedRoute roles={["admin", "hr_officer"]}>
                  <HRPortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="jobs" replace />} />
              <Route path="jobs" element={<JobPostingsList />} />
              <Route path="applicants" element={<ApplicantsList />} />
              <Route path="interviews" element={<InterviewsList />} />
              <Route path="offers" element={<OffersList />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
