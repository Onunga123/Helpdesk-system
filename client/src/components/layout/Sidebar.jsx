import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaTicketAlt,
  FaBook,
  FaLaptop,
  FaChartBar,
  FaUsers,
  FaSignOutAlt,
  FaTimes,
  FaUserCog,
  FaArrowLeft,
} from 'react-icons/fa';
import { HR_NAV_ITEMS } from './hrNavItems';
import './Layout.css';

const HELP_DESK_ITEMS = [
  { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
  { path: '/tickets', icon: <FaTicketAlt />, label: 'Tickets' },
  { path: '/knowledge', icon: <FaBook />, label: 'Knowledge Base' },
  { path: '/assets', icon: <FaLaptop />, label: 'Assets', roles: ['admin', 'ict_officer'] },
  { path: '/reports', icon: <FaChartBar />, label: 'Reports', roles: ['admin', 'ict_officer'] },
  { path: '/admin/users', icon: <FaUsers />, label: 'User Management', roles: ['admin'] },
];

const ACCOUNT_ITEM = {
  path: '/account-settings',
  icon: <FaUserCog />,
  label: 'Account Settings',
};

const filterByRole = (items, role) =>
  items.filter((item) => !item.roles || item.roles.includes(role));

const Sidebar = ({ isOpen, onClose, onLogout, user }) => {
  const location = useLocation();
  const role = user?.role || 'student';
  const isHrOfficer = role === 'hr_officer';
  const isAdmin = role === 'admin';
  const onHrPortal = location.pathname.startsWith('/hr-portal');

  const helpDeskItems = filterByRole(HELP_DESK_ITEMS, role).filter((item) => {
    if (role === 'staff' || role === 'student') {
      return !['/assets', '/reports', '/admin/users'].includes(item.path);
    }
    return true;
  });

  const sections = [];

  if (isHrOfficer) {
    sections.push({ label: 'RECRUITMENT', items: HR_NAV_ITEMS });
    sections.push({ label: null, items: [ACCOUNT_ITEM] });
  } else if (isAdmin) {
    sections.push({ label: 'MAIN MENU', items: helpDeskItems });
    sections.push({ label: 'RECRUITMENT', items: HR_NAV_ITEMS });
    sections.push({ label: null, items: [ACCOUNT_ITEM] });
  } else if (role === 'ict_officer') {
    sections.push({ label: 'MAIN MENU', items: helpDeskItems });
    sections.push({ label: null, items: [ACCOUNT_ITEM] });
  } else {
    sections.push({ label: 'MAIN MENU', items: helpDeskItems });
    sections.push({ label: null, items: [ACCOUNT_ITEM] });
  }

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        id="app-sidebar"
        className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isHrOfficer ? 'sidebar-hr' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">{isHrOfficer ? '📋' : '🎓'}</span>
          <div>
            {isHrOfficer ? (
              <>
                <h2>TUC Recruitment</h2>
                <p>Turkana University College</p>
              </>
            ) : (
              <>
                <h2>TUC HelpDesk</h2>
                <p>ICT Support System</p>
              </>
            )}
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <FaTimes />
          </button>
        </div>

        {sections.map((section) => (
          <nav key={section.label || 'account'} className="sidebar-nav">
            {section.label && <p className="sidebar-nav-label">{section.label}</p>}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
                onClick={onClose}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        ))}

        <div className="sidebar-footer">
          {isHrOfficer && (
            <div className="sidebar-hr-contact">
              <p>HR Support</p>
              <a href="mailto:hr@tuc.ac.ke">hr@tuc.ac.ke</a>
            </div>
          )}

          {isAdmin && onHrPortal && (
            <Link to="/dashboard" className="sidebar-back-link" onClick={onClose}>
              <FaArrowLeft aria-hidden="true" />
              <span>Back to Help Desk</span>
            </Link>
          )}

          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
