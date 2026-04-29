import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaTicketAlt, FaBook, FaLaptop,
  FaChartBar, FaUsers, FaSignOutAlt, FaTimes,
} from 'react-icons/fa';
import './Layout.css';

const Sidebar = ({ isOpen, onClose, onLogout, user }) => {
  const handleLogout = () => {
    onLogout();
  };

  // Navigation items based on role
  const navItems = [
    {
      path: '/dashboard',
      icon: <FaTachometerAlt />,
      label: 'Dashboard',
      roles: ['admin', 'ict_officer', 'staff', 'student'],
    },
    {
      path: '/tickets',
      icon: <FaTicketAlt />,
      label: 'Tickets',
      roles: ['admin', 'ict_officer', 'staff', 'student'],
    },
    {
      path: '/knowledge',
      icon: <FaBook />,
      label: 'Knowledge Base',
      roles: ['admin', 'ict_officer', 'staff', 'student'],
    },
    {
      path: '/assets',
      icon: <FaLaptop />,
      label: 'Assets',
      roles: ['admin', 'ict_officer'],
    },
    {
      path: '/reports',
      icon: <FaChartBar />,
      label: 'Reports',
      roles: ['admin', 'ict_officer'],
    },
    {
      path: '/admin/users',
      icon: <FaUsers />,
      label: 'User Management',
      roles: ['admin'],
    },
  ];

  // Filter nav items by user role
  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const roleLabel = {
    admin: 'Administrator',
    ict_officer: 'ICT Officer',
    staff: 'Staff',
    student: 'Student',
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
        aria-label="Primary navigation"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🎓</span>
          <div>
            <h2>TUC HelpDesk</h2>
            <p>ICT Support System</p>
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

        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <span className="sidebar-user-role">
              {roleLabel[user?.role]}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">MAIN MENU</p>
          {filteredNav.map((item) => (
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

        {/* Logout */}
        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;