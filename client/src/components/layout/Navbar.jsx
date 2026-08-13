import React from 'react';
import { useLocation } from 'react-router-dom';
import { FaBars, FaUserCircle } from 'react-icons/fa';
import NotificationBell from '../notifications/NotificationBell';
import { getActiveHrNavItem } from './hrNavItems';
import './Layout.css';

const Navbar = ({ onMenuClick, user }) => {
  const location = useLocation();
  const isHrOfficer = user?.role === 'hr_officer';
  const isHrPortalRoute = location.pathname.startsWith('/hr-portal');
  const activeHrItem = getActiveHrNavItem(location.pathname);
  const isAccountSettings = location.pathname.startsWith('/account-settings');

  const roleColors = {
    admin: '#dc3545',
    hr_officer: '#0d9488',
    ict_officer: '#17a2b8',
    staff: '#28a745',
    student: '#1a3c6e',
  };

  const roleLabel = {
    admin: 'Administrator',
    hr_officer: 'HR Officer',
    ict_officer: 'ICT Officer',
    staff: 'Staff',
    student: 'Student',
  };

  const showHrPageTitle = isHrOfficer
    ? activeHrItem || isAccountSettings
    : isHrPortalRoute && activeHrItem;

  let title = 'ICT Help Desk';
  let subtitle = 'Turkana University College';

  if (showHrPageTitle) {
    if (isAccountSettings) {
      title = 'Account Settings';
      subtitle = 'Manage your profile and preferences';
    } else if (activeHrItem) {
      title = activeHrItem.label;
      subtitle = activeHrItem.hint;
    }
  } else if (isHrOfficer) {
    title = 'TUC Recruitment';
    subtitle = 'Turkana University College';
  }

  return (
    <header className={`navbar ${isHrOfficer ? 'navbar-hr' : ''}`}>
      <button
        type="button"
        className="navbar-menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        aria-controls="app-sidebar"
      >
        <FaBars />
      </button>

      <div className="navbar-center">
        <h1 className="navbar-title">{title}</h1>
        <p className="navbar-subtitle">{subtitle}</p>
      </div>

      <div className="navbar-right">
        {!isHrOfficer && <NotificationBell />}
        <div className="navbar-user">
          <FaUserCircle className="navbar-user-icon" />
          <div className="navbar-user-info">
            <p className="navbar-user-name">{user?.name}</p>
            <span
              className="navbar-user-role"
              style={{ color: roleColors[user?.role] }}
            >
              {roleLabel[user?.role] || user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
