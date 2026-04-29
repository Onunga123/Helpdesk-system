import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaListAlt,
  FaPlus,
  FaSyncAlt,
  FaTicketAlt,
  FaUserCheck,
} from 'react-icons/fa';
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

const timeAgo = (value) => {
  if (!value) return '-';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '-';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const getPerformanceMetrics = (tickets, officerId) => {
  const assigned = tickets.filter((t) => t?.assignedTo?._id === officerId);
  const resolved = assigned.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
  const resolutionRate = assigned.length ? Math.round((resolved.length / assigned.length) * 100) : null;

  const resolutionHours = resolved
    .filter((t) => t.createdAt && t.resolvedAt)
    .map((t) => (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60))
    .filter((v) => Number.isFinite(v) && v >= 0);

  const avgResolutionTime = resolutionHours.length
    ? (resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length).toFixed(1)
    : null;

  return {
    totalAssigned: assigned.length,
    totalResolved: resolved.length,
    resolutionRate,
    avgResolutionTime,
  };
};

const getRecentActivity = (assignedTickets) => {
  return [...assignedTickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map((ticket) => {
      const latestComment = [...(ticket.comments || [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const latestCommentTime = latestComment?.createdAt ? new Date(latestComment.createdAt).getTime() : 0;
      const updatedTime = ticket.updatedAt ? new Date(ticket.updatedAt).getTime() : 0;
      const changed = latestComment && Math.abs(updatedTime - latestCommentTime) < 60000
        ? 'New comment added'
        : `Status changed to ${ticket.status}`;

      return {
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        changed,
        updatedAt: ticket.updatedAt,
      };
    });
};

const ICTDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const officerId = user?._id;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigningId, setAssigningId] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [statusSelections, setStatusSelections] = useState({});

  const fetchDashboardData = async () => {
    try {
      setError('');
      setLoading(true);
      const { data } = await API.get('/tickets');
      const ticketList = data?.data || [];
      setTickets(ticketList);
      setStatusSelections((prev) => {
        const next = { ...prev };
        ticketList.forEach((ticket) => {
          next[ticket._id] = next[ticket._id] || ticket.status;
        });
        return next;
      });
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

  const inProgressTickets = useMemo(
    () => myAssignedTickets.filter((ticket) => ticket.status === 'In Progress'),
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

  const performance = useMemo(() => getPerformanceMetrics(tickets, officerId), [tickets, officerId]);
  const recentActivity = useMemo(() => getRecentActivity(myAssignedTickets), [myAssignedTickets]);

  const assignToMe = async (ticketId) => {
    try {
      setAssigningId(ticketId);
      await API.put(`/tickets/${ticketId}`, { assignedTo: officerId });
      toast.success('Ticket assigned to you successfully');
      await fetchDashboardData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign ticket.');
    } finally {
      setAssigningId('');
    }
  };

  const updateQuickStatus = async (ticketId) => {
    try {
      setStatusUpdatingId(ticketId);
      await API.put(`/tickets/${ticketId}`, { status: statusSelections[ticketId] });
      toast.success('Ticket status updated');
      await fetchDashboardData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update ticket status.');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const renderTicketTable = (rows, emptyMessage, actionRenderer) => {
    if (!rows.length) {
      return (
        <div className="empty-state dashboard-empty-compact">
          <FaTicketAlt />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Title</th>
              <th>Submitted By</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ticket) => (
              <tr key={ticket._id}>
                <td className="ticket-number dashboard-mono">{ticket.ticketNumber}</td>
                <td className="ticket-title">{ticket.title}</td>
                <td>
                  <div className="dashboard-meta-stack">
                    <span>{ticket?.submittedBy?.name || 'Unknown'}</span>
                    <span className="dashboard-meta-muted">{ticket?.submittedBy?.department || '-'}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${priorityBadgeClass[ticket.priority] || 'badge-medium'} ${ticket.priority === 'Critical' ? 'dashboard-badge-critical' : ''}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge ${statusBadgeClass[ticket.status] || 'badge-open'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>{formatDate(ticket.createdAt)}</td>
                <td>{actionRenderer(ticket)}</td>
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
    <section className="dashboard" aria-label="ICT officer dashboard">
      <header className="page-header">
        <div>
          <h1 className="um-title">ICT Officer Dashboard</h1>
          <p className="um-subtitle">Manage and resolve ICT support tickets efficiently</p>
          <p className="dashboard-last-updated">Welcome back, <strong>{user?.name || 'Officer'}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/tickets/create" className="btn btn-primary">
            <FaPlus /> New Ticket
          </Link>
          <button type="button" className="btn btn-secondary" onClick={fetchDashboardData}>
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </header>

      {criticalTickets.length > 0 && (
        <div className="alert-critical" role="alert">
          <FaExclamationTriangle />
          <div>
            <strong>{criticalTickets.length} Critical Ticket(s) need attention</strong>
            <p>These unresolved critical tickets should be prioritized immediately.</p>
          </div>
          <Link to="/tickets?priority=Critical" className="alert-link">
            View Critical Tickets <FaArrowRight />
          </Link>
        </div>
      )}

      <div className="dashboard-metrics" role="list" aria-label="Officer stats">
        <article className="metric-card" role="listitem">
          <div className="metric-icon" style={{ color: '#2563eb', background: 'rgba(37,99,235,0.12)' }}>
            <FaUserCheck />
          </div>
          <div>
            <p className="metric-label">My Assigned Tickets</p>
            <p className="metric-value">{myAssignedTickets.length}</p>
            <p className="metric-note">Tickets assigned to you</p>
          </div>
        </article>
        <article className="metric-card" role="listitem">
          <div className="metric-icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.14)' }}>
            <FaClock />
          </div>
          <div>
            <p className="metric-label">Open Tickets</p>
            <p className="metric-value">{unassignedTickets.length}</p>
            <p className="metric-note">Unassigned open tickets</p>
          </div>
        </article>
        <article className="metric-card" role="listitem">
          <div className="metric-icon" style={{ color: '#16a34a', background: 'rgba(22,163,74,0.14)' }}>
            <FaCheckCircle />
          </div>
          <div>
            <p className="metric-label">Resolved Today</p>
            <p className="metric-value">{resolvedToday}</p>
            <p className="metric-note">Resolved by you today</p>
          </div>
        </article>
        <article className="metric-card" role="listitem">
          <div className="metric-icon" style={{ color: '#b91c1c', background: 'rgba(185,28,28,0.14)' }}>
            <FaExclamationTriangle />
          </div>
          <div>
            <p className="metric-label">Critical Tickets</p>
            <p className="metric-value">{criticalTickets.length}</p>
            <p className="metric-note">Unresolved critical requests</p>
          </div>
        </article>
      </div>

      <article className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">My Assigned Tickets</h2>
          <Link to="/tickets" className="card-link">
            View All <FaArrowRight />
          </Link>
        </div>
        {renderTicketTable(
          [...myAssignedTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
          'No tickets assigned to you yet',
          (ticket) => (
            <Link to={`/tickets/${ticket._id}`} className="table-action-btn">
              Update
            </Link>
          )
        )}
      </article>

      <article className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Unassigned Tickets - Needs Attention</h2>
          <span className="badge badge-progress">{unassignedTickets.length}</span>
        </div>
        {renderTicketTable(
          [...unassignedTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
          'All tickets are currently assigned. Great work!',
          (ticket) => (
            <button
              type="button"
              className="table-action-btn"
              onClick={() => assignToMe(ticket._id)}
              disabled={assigningId === ticket._id}
            >
              {assigningId === ticket._id ? 'Assigning...' : 'Assign to Me'}
            </button>
          )
        )}
      </article>

      <div className="dashboard-grid">
        <article className="dashboard-card span-6">
          <div className="card-header">
            <h2 className="card-title">Quick Status Update</h2>
          </div>
          <div className="dashboard-section-stack">
            {inProgressTickets.length ? (
              inProgressTickets.map((ticket) => (
                <div key={ticket._id} className="dashboard-inline-panel">
                  <div className="dashboard-inline-main">
                    <div className="dashboard-mono dashboard-inline-title">{ticket.ticketNumber}</div>
                    <div className="dashboard-inline-subtitle">{ticket.title}</div>
                    <span className={`badge ${statusBadgeClass[ticket.status] || 'badge-open'}`}>{ticket.status}</span>
                  </div>
                  <div className="dashboard-inline-actions">
                    <select
                      className="um-select"
                      value={statusSelections[ticket._id] || ticket.status}
                      onChange={(e) => setStatusSelections((prev) => ({ ...prev, [ticket._id]: e.target.value }))}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => updateQuickStatus(ticket._id)}
                      disabled={statusUpdatingId === ticket._id}
                    >
                      {statusUpdatingId === ticket._id ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state dashboard-empty-compact">
                <FaListAlt />
                <p>No tickets currently in progress</p>
              </div>
            )}
          </div>
        </article>

        <article className="dashboard-card span-6">
          <div className="card-header">
            <h2 className="card-title">My Performance</h2>
          </div>
          <div className="dashboard-performance-grid">
            <div className="dashboard-performance-item">
              <FaTicketAlt className="snapshot-icon info" />
              <div>
                <div className="dashboard-performance-value">{performance.totalAssigned}</div>
                <div className="dashboard-performance-label">Total Assigned</div>
              </div>
            </div>
            <div className="dashboard-performance-item">
              <FaCheckCircle className="snapshot-icon success" />
              <div>
                <div className="dashboard-performance-value">{performance.totalResolved}</div>
                <div className="dashboard-performance-label">Total Resolved</div>
              </div>
            </div>
            <div className="dashboard-performance-item">
              <FaChartBar className="snapshot-icon warning" />
              <div>
                <div className="dashboard-performance-value">
                  {performance.resolutionRate === null ? 'N/A' : `${performance.resolutionRate}%`}
                </div>
                <div className="dashboard-performance-label">Resolution Rate</div>
              </div>
            </div>
            <div className="dashboard-performance-item">
              <FaClock className="snapshot-icon purple" />
              <div>
                <div className="dashboard-performance-value">
                  {performance.avgResolutionTime === null ? 'N/A' : `${performance.avgResolutionTime}h`}
                </div>
                <div className="dashboard-performance-label">Avg Resolution Time</div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Recent Activity</h2>
        </div>
        <div className="dashboard-activity-list">
          {recentActivity.length ? (
            recentActivity.map((item) => (
              <Link key={item._id} to={`/tickets/${item._id}`} className="dashboard-activity-item">
                <div>
                  <div className="dashboard-inline-title">{item.ticketNumber} - {item.title}</div>
                  <div className="dashboard-inline-subtitle">{item.changed}</div>
                </div>
                <div className="dashboard-activity-meta">
                  <span>{timeAgo(item.updatedAt)}</span>
                  <FaArrowRight />
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state dashboard-empty-compact">
              <FaClock />
              <p>No recent activity yet</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );
};

export default ICTDashboard;
