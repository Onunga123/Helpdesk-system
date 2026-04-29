import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaTicketAlt,
  FaRegClock,
  FaInfoCircle,
  FaExclamationCircle,
  FaFileAlt,
  FaListUl,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import API from '../../api/axios';
import './Dashboard.css';

const formatDate = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return '-';
  }
};

const timeAgo = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const t = dt.getTime();
  if (Number.isNaN(t)) return '';
  const diffMs = Date.now() - t;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec} seconds ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minutes ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hours ago`;
  const day = Math.floor(hr / 24);
  return `${day} days ago`;
};

const statusToBadge = (status) => {
  const s = String(status || '').trim();
  if (s === 'Open') return 'badge-open';
  if (s === 'In Progress') return 'badge-progress';
  if (s === 'Resolved') return 'badge-resolved';
  if (s === 'Closed') return 'badge-closed';
  return 'badge-open';
};

const priorityToBadge = (priority) => {
  const p = String(priority || '').trim();
  if (p === 'Low') return 'badge-low';
  if (p === 'Medium') return 'badge-medium';
  if (p === 'High') return 'badge-high';
  if (p === 'Critical') return 'badge-critical';
  return 'badge-medium';
};

const StudentDashboardFixed = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [myTickets, setMyTickets] = useState([]);

  const [kbLoading, setKbLoading] = useState(true);
  const [articles, setArticles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Network Issue',
    priority: 'Medium',
    description: '',
  });

  const displayName = me?.name || user?.name || 'User';
  const displayDept = me?.department || user?.department || 'Department';

  const refreshTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await API.get('/tickets');
      setMyTickets(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load tickets.');
      setMyTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setProfileLoading(true);
        const res = await API.get('/auth/me');
        setMe(res?.data?.data || null);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load user profile.');
      } finally {
        setProfileLoading(false);
      }

      await refreshTickets();

      setKbLoading(true);
      try {
        const listRes = await API.get('/knowledge', { params: { status: 'published' } });
        const base = Array.isArray(listRes?.data?.data) ? listRes.data.data : [];
        const top4 = base.slice(0, 4);

        const detailed = await Promise.all(
          top4.map(async (a) => {
            try {
              const id = a._id || a.id;
              const detailRes = await API.get(`/knowledge/${id}`);
              return detailRes?.data?.data || a;
            } catch {
              return a;
            }
          })
        );
        setArticles(detailed);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load knowledge base.');
        setArticles([]);
      } finally {
        setKbLoading(false);
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = myTickets.length;
    const open = myTickets.filter((t) => t.status === 'Open').length;
    const inProgress = myTickets.filter((t) => t.status === 'In Progress').length;
    const resolved = myTickets.filter((t) => t.status === 'Resolved').length;
    return { total, open, inProgress, resolved };
  }, [myTickets]);

  const myRecentTickets = useMemo(() => {
    const sorted = [...myTickets].sort((a, b) => {
      const at = new Date(a.createdAt || 0).getTime();
      const bt = new Date(b.createdAt || 0).getTime();
      return bt - at;
    });
    return sorted.slice(0, 5);
  }, [myTickets]);

  const activeTickets = useMemo(() => {
    const active = myTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress');
    const sorted = active.sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    });
    return sorted.slice(0, 3);
  }, [myTickets]);

  const recentUpdates = useMemo(() => {
    const sorted = [...myTickets].sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    });
    return sorted.slice(0, 3);
  }, [myTickets]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error('Title is required.');
    if (!form.category) return toast.error('Category is required.');
    if (!form.description || form.description.trim().length < 20) {
      return toast.error('Description must be at least 20 characters.');
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
        department: displayDept,
      };

      const res = await API.post('/tickets', payload);
      const ticket = res?.data?.data;
      toast.success(
        `Ticket submitted successfully! Ticket number: ${ticket?.ticketNumber || 'TUC-XXXX-XXXX'}`
      );

      setForm({ title: '', category: 'Network Issue', priority: 'Medium', description: '' });
      await refreshTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const trackerStepState = (ticketStatus, stepIndex) => {
    // stepIndex: 1..4
    if (stepIndex === 1) {
      if (ticketStatus === 'Open') return 'current';
      return 'done';
    }
    if (stepIndex === 2) {
      if (ticketStatus === 'In Progress') return 'current';
      if (ticketStatus === 'Resolved' || ticketStatus === 'Closed') return 'done';
      return 'future';
    }
    if (stepIndex === 3) {
      if (ticketStatus === 'Resolved' || ticketStatus === 'Closed') return 'done';
      return 'future';
    }
    if (stepIndex === 4) {
      if (ticketStatus === 'Closed') return 'done';
      return 'future';
    }
    return 'future';
  };

  return (
    <section aria-label="Administrator dashboard">
      <header className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text)' }}>My ICT Support Dashboard</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>Submit and track your ICT support requests</p>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Welcome, <strong style={{ color: 'var(--text)' }}>{profileLoading ? '...' : displayName}</strong> •{' '}
            {profileLoading ? '' : displayDept}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/tickets/create" className="btn btn-primary">
            <FaTicketAlt />
            Submit New Ticket
          </Link>
        </div>
      </header>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <article className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ color: '#2563eb', background: 'rgba(37, 99, 235, 0.12)' }}>
            <FaTicketAlt />
          </div>
          <div>
            <p className="stat-value">{ticketsLoading ? '—' : stats.total}</p>
            <p className="stat-label">My Total Tickets</p>
          </div>
        </article>

        <article className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.14)' }}>
            <FaExclamationCircle />
          </div>
          <div>
            <p className="stat-value">{ticketsLoading ? '—' : stats.open}</p>
            <p className="stat-label">Open Tickets</p>
          </div>
        </article>

        <article className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ color: '#ca8a04', background: 'rgba(202, 138, 4, 0.14)' }}>
            <FaRegClock />
          </div>
          <div>
            <p className="stat-value">{ticketsLoading ? '—' : stats.inProgress}</p>
            <p className="stat-label">In Progress</p>
          </div>
        </article>

        <article className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.12)' }}>
            <FaInfoCircle />
          </div>
          <div>
            <p className="stat-value">{ticketsLoading ? '—' : stats.resolved}</p>
            <p className="stat-label">Resolved Tickets</p>
          </div>
        </article>
      </div>

      <div className="dashboard-section-stack">
        <article className="card">
          <div className="card-header">
            <h2 className="card-title">My Recent Tickets</h2>
            <Link to="/tickets" className="btn btn-sm" style={{ textDecoration: 'none' }}>
              View All
            </Link>
          </div>
          <div className="card-body">
            {ticketsLoading ? (
              <div className="spinner-wrap" role="status" aria-live="polite" aria-label="Loading tickets">
                <div className="spinner" />
              </div>
            ) : myRecentTickets.length === 0 ? (
              <div className="empty-state">
                <FaInfoCircle />
                <p>You have not submitted any tickets yet. Click Submit New Ticket to get started.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ticket #</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRecentTickets.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <Link to={`/tickets/${t._id}`} className="ticket-number">
                            {t.ticketNumber}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/tickets/${t._id}`} className="ticket-title">
                            {t.title}
                          </Link>
                        </td>
                        <td>{t.category || '-'}</td>
                        <td>
                          <span className={`badge ${priorityToBadge(t.priority)}`}>{t.priority || 'Medium'}</span>
                        </td>
                        <td>
                          <span className={`badge ${statusToBadge(t.status)}`}>{t.status || 'Open'}</span>
                        </td>
                        <td>{formatDate(t.createdAt)}</td>
                        <td>
                          <Link to={`/tickets/${t._id}`} className="btn btn-secondary btn-sm">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Submit</h2>
          </div>
          <div className="card-body">
            <form onSubmit={onSubmit} className="um-form-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr 0.7fr 2fr auto' }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Title *</label>
                <input
                  className="um-input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Cannot access Wi-Fi"
                  required
                />
              </div>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Category *</label>
                <select
                  className="um-select"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                >
                  <option>Network Issue</option>
                  <option>Hardware Repair</option>
                  <option>Software Installation</option>
                  <option>Email Issue</option>
                  <option>Password Reset</option>
                  <option>Printer Issue</option>
                  <option>Computer Maintenance</option>
                  <option>System Access</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Priority</label>
                <select className="um-select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Description *</label>
                <textarea
                  className="um-input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue clearly (min 20 characters)."
                  rows={3}
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Track Your Tickets</h2>
          </div>
          <div className="card-body">
            {ticketsLoading ? (
              <div className="spinner-wrap" role="status" aria-live="polite" aria-label="Loading tracker">
                <div className="spinner" />
              </div>
            ) : activeTickets.length === 0 ? (
              <div className="empty-state">
                <FaExclamationCircle />
                <p>No active tickets. All your issues have been resolved!</p>
              </div>
            ) : (
              <div className="ticket-tracker-list">
                {activeTickets.map((t) => {
                  const assignedName = t.assignedTo?.name;
                  const ticketStatus = t.status;

                  const completedPct =
                    ticketStatus === 'Open'
                      ? 0
                      : ticketStatus === 'In Progress'
                        ? 25
                        : ticketStatus === 'Resolved'
                          ? 50
                          : 75;
                  const currentPct =
                    ticketStatus === 'Open'
                      ? 25
                      : ticketStatus === 'In Progress'
                        ? 50
                        : ticketStatus === 'Resolved'
                          ? 75
                          : 100;

                  return (
                    <div className="ticket-tracker-item" key={t._id}>
                      <div
                        className="ticket-tracker-steps"
                        aria-label={`Progress for ${t.ticketNumber}`}
                        style={{ '--completed-pct': `${completedPct}%`, '--current-pct': `${currentPct}%` }}
                      >
                        {[1, 2, 3, 4].map((idx) => {
                          const state = trackerStepState(ticketStatus, idx);
                          const label =
                            idx === 1 ? 'Open' : idx === 2 ? 'In Progress' : idx === 3 ? 'Resolved' : 'Closed';
                          return (
                            <div key={idx} className={`ticket-tracker-step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                              <div className="ticket-tracker-dot" />
                              <div className="ticket-tracker-step-label">{label}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="ticket-tracker-details">
                        <div className="ticket-tracker-top">
                          <Link to={`/tickets/${t._id}`} className="ticket-number">
                            {t.ticketNumber}
                          </Link>
                          <span className={`badge ${statusToBadge(t.status)}`}>{t.status}</span>
                        </div>
                        <div className="ticket-tracker-title">{t.title}</div>
                        <div className="ticket-tracker-assigned">
                          {assignedName ? (
                            <>
                              Assigned to: <strong>{assignedName}</strong>
                            </>
                          ) : (
                            <span className="muted">Awaiting assignment</span>
                          )}
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <Link to={`/tickets/${t._id}`} className="btn btn-secondary btn-sm">
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ marginBottom: 6 }}>
                Self-Service Help
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Find answers to common ICT problems before submitting a ticket
              </p>
            </div>
            <div style={{ minWidth: 280 }}>
              <div className="um-search-wrap">
                <span className="um-search-icon">
                  <FaSearch />
                </span>
                <input
                  className="um-input"
                  type="text"
                  placeholder="Search articles..."
                  defaultValue=""
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = e.currentTarget.value.trim();
                      if (q) navigate(`/knowledge?q=${encodeURIComponent(q)}`);
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div className="card-body">
            {kbLoading ? (
              <div className="spinner-wrap" role="status" aria-live="polite" aria-label="Loading knowledge base">
                <div className="spinner" />
              </div>
            ) : articles.length === 0 ? (
              <div className="empty-state">
                <FaFileAlt />
                <p>No articles available yet</p>
              </div>
            ) : (
              <>
                <div className="kb-article-grid">
                  {articles.map((a) => (
                    <div key={a._id} className="kb-article-card">
                      <div className="kb-article-meta">
                        <span className="badge badge-info">{a.category || 'General'}</span>
                        <span className="kb-article-views">{a.views ?? 0} views</span>
                      </div>
                      <div className="kb-article-title" title={a.title}>
                        {a.title}
                      </div>
                      <div className="kb-article-preview">
                        {typeof a.content === 'string' && a.content.trim()
                          ? a.content.trim().slice(0, 100) + (a.content.trim().length > 100 ? '...' : '')
                          : 'Preview not available.'}
                      </div>
                      <div className="kb-article-actions">
                        <Link to={`/knowledge/${a._id}`} className="btn btn-primary btn-sm">
                          Read Article
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14 }}>
                  <Link to="/knowledge" className="btn btn-secondary">
                    Browse All Articles
                  </Link>
                </div>
              </>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Updates on My Tickets</h2>
          </div>
          <div className="card-body">
            {ticketsLoading ? (
              <div className="spinner-wrap" role="status" aria-live="polite" aria-label="Loading updates">
                <div className="spinner" />
              </div>
            ) : recentUpdates.length === 0 ? (
              <div className="empty-state">
                <FaListUl />
                <p>No recent updates on your tickets</p>
              </div>
            ) : (
              <div className="recent-updates-list">
                {recentUpdates.map((t) => {
                  const comments = Array.isArray(t.comments) ? t.comments : [];
                  const latestComment = comments.length
                    ? [...comments].sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )[0]
                    : null;

                  return (
                    <Link key={t._id} to={`/tickets/${t._id}`} className="recent-update-item">
                      <div className="recent-update-main">
                        <div className="recent-update-top">
                          <span className="ticket-number">{t.ticketNumber}</span>
                          <span className={`badge ${statusToBadge(t.status)}`}>{t.status}</span>
                        </div>
                        <div className="recent-update-title">{t.title}</div>
                        <div className="recent-update-sub">
                          {latestComment ? (
                            <>
                              <strong>{latestComment.userName || 'User'}:</strong>{' '}
                              {latestComment.comment?.slice(0, 80)}
                              {latestComment.comment && latestComment.comment.length > 80 ? '...' : ''}
                            </>
                          ) : (
                            <span className="muted">No comments yet</span>
                          )}
                        </div>
                      </div>
                      <div className="recent-update-time">
                        <FaRegClock />
                        <span>Updated {timeAgo(t.updatedAt || t.createdAt)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </article>

        <article className="card student-help-card">
          <div className="card-header">
            <h2 className="card-title">Need More Help?</h2>
          </div>
          <div className="card-body">
            <div className="help-grid">
              <div>
                <div className="help-label">Email</div>
                <div className="help-value">ict@tuc.ac.ke</div>
              </div>
              <div>
                <div className="help-label">Phone</div>
                <div className="help-value">+254 XXX XXX XXX</div>
              </div>
              <div>
                <div className="help-label">Location</div>
                <div className="help-value">Admin Block Room 12</div>
              </div>
              <div>
                <div className="help-label">Working Hours</div>
                <div className="help-value">Mon–Fri, 8:00 AM – 5:00 PM</div>
              </div>
            </div>
            <div className="help-actions">
              <Link to="/tickets/create" className="btn btn-primary">
                Submit a Ticket
              </Link>
              <Link to="/knowledge" className="btn btn-secondary">
                Visit Knowledge Base
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default StudentDashboardFixed;

