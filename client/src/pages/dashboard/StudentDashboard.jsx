import { Link } from 'react-router-dom';
import './Dashboard.css';

const StudentDashboard = () => (
  <section className="dashboard" aria-label="Student dashboard">
    <div className="dashboard-header">
      <div>
        <h1 className="dashboard-title">Student Dashboard</h1>
        <p className="dashboard-subtitle">
          Track your ICT tickets, updates, and support resources.
        </p>
      </div>
      <span className="dashboard-chip">Role: Student</span>
    </div>

    <div className="dashboard-metrics">
      <article className="metric-card">
        <p className="metric-label">Open Tickets</p>
        <p className="metric-value">2</p>
        <p className="metric-note">Needs response from ICT</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">In Progress</p>
        <p className="metric-value">1</p>
        <p className="metric-note">Assigned to officer</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">Resolved</p>
        <p className="metric-value">8</p>
        <p className="metric-note">This semester</p>
      </article>
      <article className="metric-card">
        <p className="metric-label">Avg. Resolution</p>
        <p className="metric-value">1.8d</p>
        <p className="metric-note">Last 10 tickets</p>
      </article>
    </div>

    <div className="dashboard-grid">
      <article className="dashboard-card span-8">
        <h2>Recent Activity</h2>
        <p>Your latest ticket was updated 2 hours ago by ICT support.</p>
      </article>
      <article className="dashboard-card span-4">
        <h2>Quick Actions</h2>
        <div className="quick-links">
          <Link className="quick-link" to="/tickets/create">Create Ticket</Link>
          <Link className="quick-link" to="/tickets">View My Tickets</Link>
          <Link className="quick-link" to="/knowledge">Open Knowledge Base</Link>
        </div>
      </article>
    </div>
  </section>
);

export default StudentDashboard;