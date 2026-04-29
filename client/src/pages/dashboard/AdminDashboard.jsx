import { Link } from 'react-router-dom';
import './Dashboard.css';

const AdminDashboard = () => (
  <section className="dashboard" aria-label="Administrator dashboard">
    <div className="dashboard-header">
      <div>
        <h1 className="dashboard-title">Administrator Dashboard</h1>
        <p className="dashboard-subtitle">
          Review system health, user management, and service performance.
        </p>
      </div>
      <span className="dashboard-chip">Role: Administrator</span>
    </div>

    <div className="dashboard-metrics">
      <article className="metric-card">
        <p className="metric-label">Total Users</p>
        <p className="metric-value">324</p>
        <p className="metric-note">All departments</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">Open Tickets</p>
        <p className="metric-value">41</p>
        <p className="metric-note">Across all teams</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">System Availability</p>
        <p className="metric-value">99.8%</p>
        <p className="metric-note">Last 30 days</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">Policy Alerts</p>
        <p className="metric-value">2</p>
        <p className="metric-note">Pending review</p>
      </article>
    </div>

    <div className="dashboard-grid">
      <article className="dashboard-card span-8">
        <h2>Executive Snapshot</h2>
        <p>
          Ticket inflow increased by 12% this week; consider allocating one extra
          ICT officer during peak hours.
        </p>
      </article>
      <article className="dashboard-card span-4">
        <h2>Quick Actions</h2>
        <div className="quick-links">
          <Link className="quick-link" to="/admin/users">Manage Users</Link>
          <Link className="quick-link" to="/reports">Open Reports</Link>
          <Link className="quick-link" to="/assets">Review Assets</Link>
        </div>
      </article>
    </div>
  </section>
);

export default AdminDashboard;