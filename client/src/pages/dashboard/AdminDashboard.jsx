import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaArrowRight,
  FaChartBar,
  FaClock,
  FaExclamationTriangle,
  FaLaptop,
  FaPlus,
  FaSyncAlt,
  FaTicketAlt,
  FaUsers,
} from 'react-icons/fa';
import API from '../../api/axios';
import './Dashboard.css';

const statusBadge = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  Resolved: 'badge-resolved',
  Closed: 'badge-closed',
};

const priorityBadge = {
  Low: 'badge-low',
  Medium: 'badge-medium',
  High: 'badge-high',
  Critical: 'badge-critical',
};

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setError('');
      setLoading(true);
      const { data } = await API.get('/reports/dashboard');
      setStats(data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statusRows = useMemo(
    () => [
      { label: 'Open', value: stats?.tickets?.open || 0, color: '#2563eb' },
      { label: 'In Progress', value: stats?.tickets?.inProgress || 0, color: '#f59e0b' },
      { label: 'Resolved', value: stats?.tickets?.resolved || 0, color: '#22c55e' },
      { label: 'Closed', value: stats?.tickets?.closed || 0, color: '#8b5cf6' },
    ],
    [stats]
  );

  const priorityRows = useMemo(() => {
    const rows = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    (stats?.recentTickets || []).forEach((ticket) => {
      if (rows[ticket.priority] !== undefined) rows[ticket.priority] += 1;
    });
    return rows;
  }, [stats]);

  const maxStatus = Math.max(...statusRows.map((row) => row.value), 1);
  const criticalCount = stats?.criticalTickets?.length || 0;
  const resolvedRate = stats?.tickets?.total
    ? Math.round(((stats?.tickets?.resolved || 0) / stats.tickets.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="spinner-wrap" role="status" aria-live="polite" aria-label="Loading admin dashboard">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" role="alert" style={{ marginTop: 8 }}>
        <div className="card-header">
          <h2 className="card-title">Unable to load admin dashboard</h2>
        </div>
        <div className="card-body">
          <p>{error}</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={fetchStats}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Administrator dashboard">
      <header className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text)' }}>Administrator Dashboard</h1>
            <span className="badge badge-progress" style={{ fontSize: '0.74rem' }}>
              Administrator
            </span>
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
            Monitor tickets, users, assets and service health
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/tickets/create" className="btn btn-primary">
            <FaPlus /> New Ticket
          </Link>
          <button type="button" className="btn btn-secondary" onClick={fetchStats}>
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </header>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

      <div className="stats-grid">
        <Link className="stat-card" to="/tickets">
          <div className="stat-icon" style={{ color: '#2563eb', background: 'rgba(37, 99, 235, 0.12)' }}>
            <FaTicketAlt />
          </div>
          <div>
            <p className="stat-value">{stats?.tickets?.total || 0}</p>
            <p className="stat-label">Total Tickets</p>
          </div>
        </Link>

        <Link className="stat-card" to="/tickets">
          <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.14)' }}>
            <FaClock />
          </div>
          <div>
            <p className="stat-value">{stats?.tickets?.open || 0}</p>
            <p className="stat-label">Open Tickets</p>
          </div>
        </Link>

        <Link className="stat-card" to="/admin/users">
          <div className="stat-icon" style={{ color: '#7c3aed', background: 'rgba(124, 58, 237, 0.12)' }}>
            <FaUsers />
          </div>
          <div>
            <p className="stat-value">{stats?.users?.total || 0}</p>
            <p className="stat-label">Total Users</p>
          </div>
        </Link>

        <Link className="stat-card" to="/assets">
          <div className="stat-icon" style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.12)' }}>
            <FaLaptop />
          </div>
          <div>
            <p className="stat-value">{stats?.assets?.total || 0}</p>
            <p className="stat-label">Total Assets</p>
          </div>
        </Link>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.14)' }}>
            <FaExclamationTriangle />
          </div>
          <div>
            <p className="stat-value">{criticalCount}</p>
            <p className="stat-label">Needs immediate attention</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.14)' }}>
            <FaChartBar />
          </div>
          <div>
            <p className="stat-value">{resolvedRate}%</p>
            <p className="stat-label">Tickets resolved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ca8a04', background: 'rgba(202, 138, 4, 0.14)' }}>
            <FaClock />
          </div>
          <div>
            <p className="stat-value">{stats?.tickets?.open || 0}</p>
            <p className="stat-label">Awaiting response</p>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: '3fr 2fr', marginTop: 24 }}>
        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Ticket Overview</h2>
          </div>
          <div className="card-body">
            {statusRows.some((r) => r.value > 0) ? (
              statusRows.map((row) => (
                <div key={row.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{row.label}</span>
                    <strong style={{ color: 'var(--text)' }}>{row.value}</strong>
                  </div>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(row.value / maxStatus) * 100}%`,
                        borderRadius: 999,
                        background: row.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FaChartBar />
                <p>No ticket data available yet</p>
              </div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Tickets by Priority</h2>
          </div>
          <div className="card-body">
            {Object.values(priorityRows).some((v) => v > 0) ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {Object.entries(priorityRows).map(([level, count]) => (
                  <div
                    key={level}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                    }}
                  >
                    <span className={`badge ${priorityBadge[level]}`}>{level}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FaChartBar />
                <p>No ticket data available yet</p>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: '13fr 7fr', marginTop: 24 }}>
        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Tickets</h2>
          </div>
          <div className="card-body">
            {stats?.recentTickets?.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ticket No</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTickets.map((ticket) => (
                      <tr key={ticket._id}>
                        <td>{ticket.ticketNumber}</td>
                        <td>{ticket.title}</td>
                        <td>
                          <span className={`badge ${statusBadge[ticket.status] || 'badge-open'}`}>{ticket.status}</span>
                        </td>
                        <td>
                          <span className={`badge ${priorityBadge[ticket.priority] || 'badge-low'}`}>{ticket.priority}</span>
                        </td>
                        <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FaTicketAlt />
                <p>No tickets submitted yet</p>
                <Link to="/tickets/create" className="btn btn-primary btn-sm">
                  Submit First Ticket
                </Link>
              </div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            <Link className="btn" to="/admin/users" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: '#7c3aed' }}>
                <FaUsers /> Manage Users
              </span>
              <FaArrowRight />
            </Link>
            <Link className="btn" to="/reports" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: '#2563eb' }}>
                <FaChartBar /> Open Reports
              </span>
              <FaArrowRight />
            </Link>
            <Link className="btn" to="/assets" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: '#16a34a' }}>
                <FaLaptop /> Review Assets
              </span>
              <FaArrowRight />
            </Link>
            <Link className="btn" to="/tickets/create" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: '#ea580c' }}>
                <FaPlus /> New Ticket
              </span>
              <FaArrowRight />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
};

export default AdminDashboard;
