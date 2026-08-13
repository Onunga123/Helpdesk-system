import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { FaBriefcase, FaClipboardList, FaSignInAlt, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import "./ApplicantPortalLayout.css";

const ApplicantPortalLayout = () => {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem("applicantId"));

  const handleLogout = () => {
    localStorage.removeItem("applicantToken");
    localStorage.removeItem("applicantId");
    navigate("/recruitment/auth");
  };

  return (
    <div className="applicant-shell">
      <header className="applicant-topbar">
        <div className="applicant-topbar-inner">
          <Link to="/recruitment/browse" className="applicant-brand">
            <span className="applicant-brand-mark" aria-hidden="true">TUC</span>
            <span>
              <strong>Careers Portal</strong>
              <small>Turkana University College</small>
            </span>
          </Link>

          <nav className="applicant-nav" aria-label="Applicant navigation">
            <NavLink to="/recruitment/browse" className={({ isActive }) => `applicant-nav-link ${isActive ? "active" : ""}`}>
              <FaBriefcase aria-hidden="true" />
              <span>Open Positions</span>
            </NavLink>
            <NavLink
              to="/recruitment/applications"
              className={({ isActive }) => `applicant-nav-link ${isActive ? "active" : ""}`}
            >
              <FaClipboardList aria-hidden="true" />
              <span>My Applications</span>
            </NavLink>
            {isLoggedIn && (
              <NavLink
                to="/recruitment/profile"
                className={({ isActive }) => `applicant-nav-link ${isActive ? "active" : ""}`}
              >
                <FaUserCircle aria-hidden="true" />
                <span>My Profile</span>
              </NavLink>
            )}
          </nav>

          <div className="applicant-actions">
            {isLoggedIn ? (
              <button type="button" className="applicant-btn applicant-btn-ghost" onClick={handleLogout}>
                <FaSignOutAlt aria-hidden="true" />
                Sign out
              </button>
            ) : (
              <Link to="/recruitment/auth" className="applicant-btn applicant-btn-primary">
                <FaSignInAlt aria-hidden="true" />
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="applicant-main">
        <Outlet />
      </main>

      <footer className="applicant-footer">
        <p>Need help? Contact HR at <a href="mailto:hr@tuc.ac.ke">hr@tuc.ac.ke</a></p>
      </footer>
    </div>
  );
};

export default ApplicantPortalLayout;
