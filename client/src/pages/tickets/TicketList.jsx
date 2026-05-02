import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiInbox,
  FiSearch,
  FiSliders,
  FiTag,
} from 'react-icons/fi';
import API from '../../api/axios';

const statusBadgeClass = (status) => {
  if (status === 'Open') return 'badge-open';
  if (status === 'In Progress') return 'badge-progress';
  if (status === 'Resolved') return 'badge-resolved';
  return 'badge-closed';
};

const priorityBadgeClass = (priority) => {
  if (priority === 'Low') return 'badge-low';
  if (priority === 'Medium') return 'badge-medium';
  if (priority === 'High') return 'badge-high';
  return 'badge-critical';
};

const CATEGORY_OPTIONS = [
  'Network Issue',
  'Hardware Repair',
  'Software Installation',
  'Email Issue',
  'Password Reset',
  'Printer Issue',
  'Computer Maintenance',
  'System Access',
  'Other',
];

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Open', value: 'Open' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'Closed', value: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { label: 'All Priority', value: '' },
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
  { label: 'Critical', value: 'Critical' },
];

const TicketList = () => {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const isPrivileged = role === 'admin' || role === 'ict_officer';

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [visibleCount, setVisibleCount] = useState(10);

  const fetchTickets = async ({ silent = false } = {}) => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;

      const { data } = await API.get('/tickets', { params });
      setTickets(data?.data || []);
      setVisibleCount(10);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, categoryFilter]);

  const filteredTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter((t) => {
      const no = (t?.ticketNumber || '').toLowerCase();
      const title = (t?.title || '').toLowerCase();
      return no.includes(term) || title.includes(term);
    });
  }, [tickets, searchTerm]);

  const visibleTickets = filteredTickets.slice(0, visibleCount);
  const hasMore = filteredTickets.length > visibleCount;
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t?.status === 'Open').length,
    inProgress: tickets.filter((t) => t?.status === 'In Progress').length,
    resolved: tickets.filter((t) => t?.status === 'Resolved').length,
    closed: tickets.filter((t) => t?.status === 'Closed').length,
  }), [tickets]);

  if (loading) {
    return (
      <section className="um-page" aria-label="Ticket list loading">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </section>
    );
  }

  return (
    <section className="um-page" aria-label="Help Desk Tickets">
      <div className="page-header">
        <div>
          <h1 className="um-title">Help Desk Tickets</h1>
          <p className="um-subtitle">Track and manage ICT support requests</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (window.location.href = '/tickets/new')}
          >
            <FiSliders /> Submit New Ticket
          </button>
        </div>
      </div>

      {isPrivileged && (
        <div className="stats-grid" aria-label="Ticket statistics">
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#2563eb' }}><FiTag /></div>
            <div>
              <p className="stat-value">{stats.total}</p>
              <p className="stat-label">Total Tickets</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#1d4ed8' }}><FiInbox /></div>
            <div>
              <p className="stat-value">{stats.open}</p>
              <p className="stat-label">Open Tickets</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#f59e0b' }}><FiInbox /></div>
            <div>
              <p className="stat-value">{stats.inProgress}</p>
              <p className="stat-label">In Progress</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#16a34a' }}><FiTag /></div>
            <div>
              <p className="stat-value">{stats.resolved}</p>
              <p className="stat-label">Resolved</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body um-filter-grid">
          <div className="um-search-wrap">
            <FiSearch className="um-search-icon" />
            <input
              className="um-input"
              placeholder="Search by ticket number or title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select className="um-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select className="um-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value || 'allp'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select className="um-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="empty-state">
          <FiAlertTriangle />
          <p>{error}</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="empty-state">
          <FiAlertTriangle />
          <p>No tickets found</p>
          <Link to="/tickets/new" className="btn btn-primary btn-sm">
            Submit First Ticket
          </Link>
        </div>
      ) : (
        <>
          <div className="table-wrap" aria-label="Tickets table">
            <table>
              <thead>
                <tr>
                  <th>Ticket No</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  {isPrivileged && <th>Submitted By</th>}
                  <th>Assigned To</th>
                  <th>Date Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map((t) => {
                  const isCritical = t?.priority === 'Critical';
                  return (
                    <tr
                      key={t._id}
                      className="um-row-hover"
                      style={isCritical ? { boxShadow: 'inset 4px 0 0 rgba(239,68,68,0.55)' } : undefined}
                    >
                      <td>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                          }}
                        >
                          {t?.ticketNumber || '-'}
                        </span>
                      </td>
                      <td>{t.title}</td>
                      <td>{t.category}</td>
                      <td>
                        <span className={`badge ${priorityBadgeClass(t.priority)}`}>{t.priority}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass(t.status)}`}>{t.status}</span>
                      </td>
                      {isPrivileged && (
                        <td>
                          {t?.submittedBy?.name ? (
                            <>
                              <div style={{ fontWeight: 700 }}>{t?.submittedBy?.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{t?.submittedBy?.department || ''}</div>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                      )}
                      <td>{t?.assignedTo?.name || 'Unassigned'}</td>
                      <td>{t?.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="um-actions">
                          <Link to={`/tickets/${t._id}`} className="btn btn-sm">
                            View <FiArrowRight />
                          </Link>
                          {isPrivileged && (
                            <Link to={`/tickets/${t._id}`} className="btn btn-sm btn-secondary">
                              Update Status
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="um-load-more-wrap">
              <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((p) => p + 10)}>
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default TicketList;