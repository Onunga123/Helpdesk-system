import React from 'react';
import { FaBars, FaBell, FaUserCircle } from 'react-icons/fa';
import './Layout.css';

const Navbar = ({ onMenuClick, user }) => {

  const roleColors = {
    admin: '#dc3545',
    ict_officer: '#17a2b8',
    staff: '#28a745',
    student: '#1a3c6e',
  };

  const roleLabel = {
    admin: 'Administrator',
    ict_officer: 'ICT Officer',
    staff: 'Staff',
    student: 'Student',
  };

  return (
    <header className="navbar">
      {/* Left — hamburger menu */}
      <button
        type="button"
        className="navbar-menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        aria-controls="app-sidebar"
      >
        <FaBars />
      </button>

      {/* Center — page title */}
      <div className="navbar-center">
        <h1 className="navbar-title">ICT Help Desk</h1>
        <p className="navbar-subtitle">Turkana University College</p>
      </div>

      {/* Right — user info */}
      <div className="navbar-right">
        <button type="button" className="navbar-icon-btn" aria-label="View notifications">
          <FaBell />
          <span className="navbar-badge">3</span>
        </button>

        <div className="navbar-user">
          <FaUserCircle className="navbar-user-icon" />
          <div className="navbar-user-info">
            <p className="navbar-user-name">{user?.name}</p>
            <span
              className="navbar-user-role"
              style={{ color: roleColors[user?.role] }}
            >
              {roleLabel[user?.role]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;