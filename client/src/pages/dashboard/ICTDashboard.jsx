import { Link } from 'react-router-dom';
import './Dashboard.css';

const ICTDashboard = () => (
  <section className="dashboard" aria-label="ICT officer dashboard">
    <div className="dashboard-header">
      <div>
        <h1 className="dashboard-title">ICT Officer Dashboard</h1>
        <p className="dashboard-subtitle">
          Monitor ticket workload, SLA risk, and response performance.
        </p>
      </div>
      <span className="dashboard-chip">Role: ICT Officer</span>
    </div>

    <div className="dashboard-metrics">
      <article className="metric-card">
        <p className="metric-label">Assigned Tickets</p>
        <p className="metric-value">17</p>
        <p className="metric-note">Active queue</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">SLA At Risk</p>
        <p className="metric-value">3</p>
        <p className="metric-note">Due in less than 8h</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">Resolved Today</p>
        <p className="metric-value">6</p>
        <p className="metric-note">Good throughput</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">Avg. First Response</p>
        <p className="metric-value">28m</p>
        <p className="metric-note">Last 24 hours</p>
      </article>
    </div>

    <div className="dashboard-grid">
      <article className="dashboard-card span-8">
        <h2>Priority Queue</h2>
        <p>Focus on high-priority network and account access requests first.</p>
      </article>
      <article className="dashboard-card span-4">
        <h2>Quick Actions</h2>
        <div className="quick-links">
          <Link className="quick-link" to="/tickets">Open Ticket Board</Link>
          <Link className="quick-link" to="/assets">Check Assets</Link>
          <Link className="quick-link" to="/reports">View Reports</Link>
        </div>
      </article>
    </div>
  </section>
);

export default ICTDashboard;