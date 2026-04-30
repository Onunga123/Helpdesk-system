import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  FiArrowRight,
  FiAlertTriangle,
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiClipboard,
  FiInbox,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiUserCheck,
} from 'react-icons/fi';
import API from '../../api/axios';
import './Dashboard.css';

const statusBadgeClass = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  Resolved: 'badge-resolved',
  Closed: 'badge-closed',
};

const priorityBadgeClass = {
  Low: 'badge-low',
  Medium: 'badge-medium',
  High: 'badge-high',
  Critical: 'badge-critical',
};

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
};

const getRecentActivity = (assignedTickets) => {
  return [...assignedTickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
};

const ICTDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const officerId = user?._id;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setError('');
      setLoading(true);
      const { data } = await API.get('/tickets');
      const ticketList = data?.data || [];
      setTickets(ticketList);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load ICT officer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const myAssignedTickets = useMemo(
    () => tickets.filter((ticket) => ticket?.assignedTo?._id === officerId),
    [tickets, officerId]
  );

  const unassignedTickets = useMemo(
    () => tickets.filter((ticket) => !ticket?.assignedTo && ticket.status === 'Open'),
    [tickets]
  );

  const pendingAssignedTickets = useMemo(
    () => myAssignedTickets.filter((ticket) => ticket.status !== 'Resolved' && ticket.status !== 'Closed'),
    [myAssignedTickets]
  );

  const criticalTickets = useMemo(
    () => tickets.filter((ticket) => ticket.priority === 'Critical' && ticket.status !== 'Closed'),
    [tickets]
  );

  const resolvedToday = useMemo(() => {
    const todayKey = new Date().toDateString();
    return myAssignedTickets.filter((ticket) => {
      if (!ticket.resolvedAt) return false;
      return new Date(ticket.resolvedAt).toDateString() === todayKey;
    }).length;
  }, [myAssignedTickets]);

  const recentActivity = useMemo(() => getRecentActivity(myAssignedTickets), [myAssignedTickets]);
  const attentionCount = pendingAssignedTickets.length + unassignedTickets.length;

  const renderTicketTable = (rows, emptyTitle, emptyDescription, showUpdatedDate = false) => {
    if (!rows.length) {
      return (
        <div className="empty-state">
          <FiInbox />
          <h3>{emptyTitle}</h3>
          <p>{emptyDescription}</p>
        </div>
      );
    }

    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ticket No</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Submitted By</th>
              <th>{showUpdatedDate ? 'Updated' : 'Date'}</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ticket) => (
              <tr key={ticket._id}>
                <td className="dashboard-mono">{ticket.ticketNumber}</td>
                <td>{ticket.title}</td>
                <td>
                  <span className={`badge ${priorityBadgeClass[ticket.priority] || 'badge-medium'}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge ${statusBadgeClass[ticket.status] || 'badge-open'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>
                  {ticket?.submittedBy?.name || '-'}
                </td>
                <td>{formatDate(showUpdatedDate ? ticket.updatedAt : ticket.createdAt)}</td>
                <td>
                  <Link to={`/tickets/${ticket._id}`} className="btn btn-sm btn-secondary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="dashboard" aria-label="ICT officer dashboard">
        <div className="spinner-wrap" role="status" aria-live="polite" aria-label="Loading ICT officer dashboard">
          <div className="spinner" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard" aria-label="ICT officer dashboard error">
        <div className="card" role="alert">
          <div className="card-header">
            <h2 className="card-title">Unable to load ICT Officer Dashboard</h2>
          </div>
          <div className="card-body">
            <p>{error}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={fetchDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="ICT officer dashboard">
      <header className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text)' }}>ICT Officer Dashboard</h1>
            <span className="badge badge-progress" style={{ fontSize: '0.74rem' }}>
              ICT Officer
            </span>
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
            Manage and resolve ICT support tickets efficiently
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/tickets/create" className="btn btn-primary">
            <FiPlus /> New Ticket
          </Link>
          <button type="button" className="btn btn-secondary" onClick={fetchDashboardData}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </header>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

      <div
        style={{
          marginBottom: 24,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 10,
          padding: '14px 20px',
          color: '#1e3a8a',
        }}
      >
        {attentionCount > 0
          ? `👋 Welcome back, ${user?.name || 'Officer'}. You have ${attentionCount} tickets awaiting your attention.`
          : `👋 Welcome back, ${user?.name || 'Officer'}. Your queue is clear. Great work!`}
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon" style={{ color: '#2563eb', background: '#eff6ff' }}>
            <FiUserCheck />
          </div>
          <div>
            <p className="stat-value">{myAssignedTickets.length}</p>
            <p className="stat-label">My Assigned Tickets</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon" style={{ color: '#ea580c', background: '#fff7ed' }}>
            <FiInbox />
          </div>
          <div>
            <p className="stat-value">{unassignedTickets.length}</p>
            <p className="stat-label">Open Tickets</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon" style={{ color: '#16a34a', background: '#f0fdf4' }}>
            <FiCheckCircle />
          </div>
          <div>
            <p className="stat-value">{resolvedToday}</p>
            <p className="stat-label">Resolved Today</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon" style={{ color: '#dc2626', background: '#fef2f2' }}>
            <FiAlertTriangle />
          </div>
          <div>
            <p className="stat-value">{criticalTickets.length}</p>
            <p className="stat-label">Critical Tickets</p>
          </div>
        </article>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: '13fr 7fr', marginTop: 24 }}>
        <article className="card">
          <div className="card-header">
            <h2 className="card-title">My Assigned Tickets</h2>
            <Link to="/tickets" className="card-link">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="card-body">
            {renderTicketTable(
              [...myAssignedTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
              'No tickets assigned yet',
              'Tickets assigned to you will appear here'
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            <Link className="btn" to="/tickets" style={{ justifyContent: 'space-between', padding: '12px 14px' }}>
              <span style={{ display: 'grid', gap: 2 }}>
                <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: '#2563eb', fontWeight: 700 }}>
                  <FiClipboard /> View All Tickets
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                  Browse open and assigned tickets
                </span>
              </span>
              <FiArrowRight />
            </Link>
            <Link className="btn" to="/reports" style={{ justifyContent: 'space-between', padding: '12px 14px' }}>
              <span style={{ display: 'grid', gap: 2 }}>
                <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: '#0f766e', fontWeight: 700 }}>
                  <FiBarChart2 /> Open Reports
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                  View performance and ticket analytics
                </span>
              </span>
              <FiArrowRight />
            </Link>
            <Link className="btn" to="/knowledge" style={{ justifyContent: 'space-between', padding: '12px 14px' }}>
              <span style={{ display: 'grid', gap: 2 }}>
                <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: '#7c3aed', fontWeight: 700 }}>
                  <FiBookOpen /> Knowledge Base
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                  Browse and manage ICT articles
                </span>
              </span>
              <FiArrowRight />
            </Link>
            <button
              type="button"
              className="btn"
              style={{ justifyContent: 'space-between', padding: '12px 14px' }}
              onClick={() => toast('Profile settings screen is coming soon')}
            >
              <span style={{ display: 'grid', gap: 2 }}>
                <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: '#475569', fontWeight: 700 }}>
                  <FiSettings /> Update Profile
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                  Manage your account settings
                </span>
              </span>
              <FiArrowRight />
            </button>
          </div>
        </article>
      </div>

      <article className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Activity</h2>
            <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Your latest ticket interactions
            </p>
          </div>
        </div>
        <div className="card-body">
          {renderTicketTable(
            recentActivity,
            'No recent activity yet',
            'Ticket updates assigned to you will appear here',
            true
          )}
        </div>
      </article>
    </section>
  );
};

export default ICTDashboard;
