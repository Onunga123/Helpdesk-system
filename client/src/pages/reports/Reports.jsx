import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiActivity,
  FiAlertCircle,
  FiBarChart2,
  FiBox,
  FiClock,
  FiDownload,
  FiGrid,
  FiLayers,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import API from '../../api/axios';

const SECTION = {
  OVERVIEW: 'overview',
  TICKETS: 'tickets',
  ASSETS: 'assets',
  USERS: 'users',
  PERFORMANCE: 'performance',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatKES = (v) => `KES ${Number(v || 0).toLocaleString('en-US')}`;

const formatDuration = (hoursValue) => {
  const hours = Number(hoursValue || 0);
  if (hours <= 0) return '-';
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
};

const badgeStatus = (status) => {
  if (status === 'Open') return 'badge-open';
  if (status === 'In Progress') return 'badge-progress';
  if (status === 'Resolved') return 'badge-resolved';
  if (status === 'Closed') return 'badge-closed';
  return 'badge-closed';
};

const badgePriority = (priority) => {
  if (priority === 'Low') return 'badge-low';
  if (priority === 'Medium') return 'badge-medium';
  if (priority === 'High') return 'badge-high';
  if (priority === 'Critical') return 'badge-critical';
  return 'badge-medium';
};

const badgeRole = (role) => {
  if (role === 'admin') return 'badge-admin';
  if (role === 'ict_officer') return 'badge-ict';
  if (role === 'staff') return 'badge-staff';
  if (role === 'student') return 'badge-student';
  return 'badge-closed';
};

const barColorStatus = (key) => {
  if (key === 'Open') return '#2563eb';
  if (key === 'In Progress') return '#eab308';
  if (key === 'Resolved') return '#16a34a';
  if (key === 'Closed') return '#9ca3af';
  return '#64748b';
};

const barColorPriority = (key) => {
  if (key === 'Low') return '#22c55e';
  if (key === 'Medium') return '#eab308';
  if (key === 'High') return '#f97316';
  if (key === 'Critical') return '#dc2626';
  return '#64748b';
};

const barColorAssetStatus = (key) => {
  if (key === 'Available') return '#22c55e';
  if (key === 'Assigned') return '#2563eb';
  if (key === 'Under Repair') return '#f97316';
  if (key === 'Decommissioned') return '#9ca3af';
  return '#64748b';
};

const barColorCondition = (key) => {
  if (key === 'New') return '#22c55e';
  if (key === 'Good') return '#2563eb';
  if (key === 'Fair') return '#eab308';
  if (key === 'Poor') return '#f97316';
  if (key === 'Faulty') return '#dc2626';
  if (key === 'Decommissioned') return '#9ca3af';
  return '#64748b';
};

const rateColor = (rate) => {
  if (rate <= 40) return '#dc2626';
  if (rate <= 70) return '#f97316';
  if (rate <= 90) return '#eab308';
  return '#16a34a';
};

const toRows = (arr) =>
  (Array.isArray(arr) ? arr : []).map((x) => ({ label: x?._id || 'Unknown', count: Number(x?.count || 0) }));

const BarRows = ({ rows, total, colorFn }) => {
  if (!rows.length) return <div className="empty-state">No data available</div>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map((r) => {
        const pct = total > 0 ? (r.count / total) * 100 : 0;
        const widthPct = max > 0 ? (r.count / max) * 100 : 0;
        return (
          <div key={r.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 3fr auto', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.86rem', fontWeight: 600 }}>{r.label}</span>
            <div style={{ background: '#f1f5f9', borderRadius: 4, height: 10 }}>
              <div
                style={{
                  background: colorFn(r.label),
                  borderRadius: 4,
                  width: `${widthPct}%`,
                  height: '100%',
                }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {r.count} ({pct.toFixed(1)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
};

const SectionCard = ({ title, children, right }) => (
  <article className="card">
    <div className="card-header">
      <h3 className="card-title">{title}</h3>
      {right}
    </div>
    <div className="card-body">{children}</div>
  </article>
);

const Reports = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isPrivileged = isAdmin || user?.role === 'ict_officer';

  const [activeSection, setActiveSection] = useState(SECTION.OVERVIEW);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  const [ticketData, setTicketData] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [assetData, setAssetData] = useState(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState('');

  const [performanceData, setPerformanceData] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState('');

  const [userReport, setUserReport] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  // Supplementary fetches for richer analytics sections
  const [allAssets, setAllAssets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);

  useEffect(() => {
    if (!isPrivileged) {
      toast.error('Not authorized');
      navigate('/dashboard');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged]);

  const fetchOverview = async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const { data } = await API.get('/reports/dashboard');
      setOverviewData(data?.data || null);
      setLastUpdated(new Date());
    } catch (err) {
      setOverviewError(err?.response?.data?.message || 'Failed to load dashboard overview.');
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchTicketsReport = async (withValidate = false) => {
    if (withValidate && startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setTicketError('Start date cannot be after end date.');
      return;
    }
    setTicketLoading(true);
    setTicketError('');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const [reportRes, allTicketRes] = await Promise.all([
        API.get('/reports/tickets', { params }),
        API.get('/tickets'),
      ]);
      setTicketData(reportRes?.data?.data || null);
      setAllTickets(Array.isArray(allTicketRes?.data?.data) ? allTicketRes.data.data : []);
      setLastUpdated(new Date());
    } catch (err) {
      setTicketError(err?.response?.data?.message || 'Failed to load ticket report.');
    } finally {
      setTicketLoading(false);
    }
  };

  const fetchAssetsReport = async () => {
    setAssetLoading(true);
    setAssetError('');
    try {
      const [reportRes, assetsRes] = await Promise.all([API.get('/reports/assets'), API.get('/assets')]);
      setAssetData(reportRes?.data?.data || null);
      setAllAssets(Array.isArray(assetsRes?.data?.data) ? assetsRes.data.data : []);
      setLastUpdated(new Date());
    } catch (err) {
      setAssetError(err?.response?.data?.message || 'Failed to load asset report.');
    } finally {
      setAssetLoading(false);
    }
  };

  const fetchPerformance = async () => {
    if (!isAdmin) return;
    setPerformanceLoading(true);
    setPerformanceError('');
    try {
      const { data } = await API.get('/reports/performance');
      const rows = Array.isArray(data?.data) ? data.data : [];
      const sorted = [...rows].sort((a, b) => Number(b.resolutionRate || 0) - Number(a.resolutionRate || 0));
      setPerformanceData(sorted);
      setLastUpdated(new Date());
    } catch (err) {
      setPerformanceError(err?.response?.data?.message || 'Failed to load performance report.');
    } finally {
      setPerformanceLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setUserLoading(true);
    setUserError('');
    try {
      const { data } = await API.get('/reports/users');
      setUserReport(data?.data || null);
      setLastUpdated(new Date());
    } catch (err) {
      setUserError(err?.response?.data?.message || 'Failed to load user report.');
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    if (!isPrivileged) return;
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivileged]);

  useEffect(() => {
    if (!isPrivileged) return;
    if (activeSection === SECTION.OVERVIEW && !overviewData && !overviewLoading) fetchOverview();
    if (activeSection === SECTION.TICKETS && !ticketData && !ticketLoading) fetchTicketsReport();
    if (activeSection === SECTION.ASSETS && !assetData && !assetLoading) fetchAssetsReport();
    if (activeSection === SECTION.PERFORMANCE && isAdmin && !performanceData.length && !performanceLoading) fetchPerformance();
    if (activeSection === SECTION.USERS && isAdmin && !userReport && !userLoading) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isAdmin, isPrivileged]);

  const onRefreshActive = () => {
    if (activeSection === SECTION.OVERVIEW) return fetchOverview();
    if (activeSection === SECTION.TICKETS) return fetchTicketsReport(true);
    if (activeSection === SECTION.ASSETS) return fetchAssetsReport();
    if (activeSection === SECTION.PERFORMANCE) return fetchPerformance();
    if (activeSection === SECTION.USERS) return fetchUsers();
  };

  const renderAssetsReportSection = () => {
    if (assetLoading) {
      return (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      );
    }
    if (assetError) {
      return renderError(assetError, fetchAssetsReport);
    }
    if (!assetData) {
      return (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <FiAlertCircle />
              <p>Loading asset report…</p>
            </div>
          </div>
        </div>
      );
    }

    try {
      const summary = assetData?.summary ?? {};
      const apiTotalAssets = Number(summary?.totalAssets ?? summary?.total ?? 0);
      const safeTotalAssets =
        apiTotalAssets > 0 ? apiTotalAssets : (Array.isArray(allAssets) ? allAssets.length : 0);
      const apiTotalValueRaw = summary?.totalValue;
      const apiTotalValueNum =
        apiTotalValueRaw !== undefined && apiTotalValueRaw !== null ? Number(apiTotalValueRaw) : NaN;
      const displayTotalValue = Number.isFinite(apiTotalValueNum)
        ? apiTotalValueNum
        : Number(assetComputed?.totalPurchaseValue ?? 0);

      const byStatus = toRows(assetData?.byStatus);
      const byCategory = toRows(assetData?.byCategory);
      const byDepartment = toRows(assetData?.byDepartment);
      const totalForBars = safeTotalAssets || 1;

      return (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            <article className="stat-card">
              <span>
                <p className="stat-value">{safeTotalAssets}</p>
                <p className="stat-label">Total Assets</p>
              </span>
            </article>
            <article className="stat-card">
              <span>
                <p className="stat-value" style={{ fontSize: '1.1rem' }}>
                  {formatKES(displayTotalValue)}
                </p>
                <p className="stat-label">Total Asset Value</p>
              </span>
            </article>
            <article className="stat-card">
              <span>
                <p className="stat-value">{(assetComputed?.expiringSoon || []).length}</p>
                <p className="stat-label">Warranty Expiring Soon</p>
              </span>
            </article>
            <article className="stat-card">
              <span>
                <p className="stat-value">{(assetComputed?.expired || []).length}</p>
                <p className="stat-label">Warranty Expired</p>
              </span>
            </article>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <SectionCard title="Assets by Status">
              <BarRows rows={byStatus} total={totalForBars} colorFn={barColorAssetStatus} />
            </SectionCard>
            <SectionCard title="Assets by Condition">
              <BarRows
                rows={[...(assetComputed?.byCondition || [])].sort((a, b) => b.count - a.count)}
                total={totalForBars}
                colorFn={barColorCondition}
              />
            </SectionCard>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <SectionCard title="Assets by Category">
              <BarRows
                rows={[...byCategory].sort((a, b) => b.count - a.count)}
                total={totalForBars}
                colorFn={() => '#2563eb'}
              />
            </SectionCard>
            <SectionCard title="Asset Value by Category">
              {!(assetComputed?.valueByCategory || []).length ? (
                <div className="empty-state">No value data</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {(assetComputed?.valueByCategory || []).map((row, idx) => (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: 10,
                        background: idx === 0 ? '#eff6ff' : '#fff',
                      }}
                    >
                      <span style={{ color: 'var(--text)', fontWeight: idx === 0 ? 800 : 600 }}>{row.label}</span>
                      <span style={{ color: '#1d4ed8', fontWeight: 700 }}>{formatKES(row.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <SectionCard title="Assets by Department">
              <BarRows
                rows={[...byDepartment].sort((a, b) => b.count - a.count)}
                total={totalForBars}
                colorFn={() => '#0ea5e9'}
              />
            </SectionCard>
            <SectionCard title="Maintenance Summary">
              <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <article className="stat-card">
                  <span>
                    <p className="stat-value">{assetComputed?.maintenance?.records ?? 0}</p>
                    <p className="stat-label">Total Maintenance Records</p>
                  </span>
                </article>
                <article className="stat-card">
                  <span>
                    <p className="stat-value" style={{ fontSize: '1.1rem' }}>
                      {formatKES(assetComputed?.maintenance?.cost ?? 0)}
                    </p>
                    <p className="stat-label">Total Maintenance Cost</p>
                  </span>
                </article>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Warranty Expiring Soon">
            {!(assetComputed?.expiringSoon || []).length ? (
              <div className="empty-state">No assets expiring soon</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Asset Tag</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Department</th>
                      <th>Warranty Expiry</th>
                      <th>Days Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assetComputed?.expiringSoon || []).map((a) => (
                      <tr
                        key={a?._id || a?.assetTag}
                        className="um-row-hover"
                        style={{
                          background:
                            a?.daysRemaining <= 7
                              ? '#fef2f2'
                              : a?.daysRemaining <= 30
                                ? '#fff7ed'
                                : undefined,
                        }}
                      >
                        <td>{a?.assetTag}</td>
                        <td>{a?.name}</td>
                        <td>{a?.category}</td>
                        <td>{a?.department || '-'}</td>
                        <td>{formatDate(a?.warrantyExpiryDate ?? a?.warrantyExpiry)}</td>
                        <td>{a?.daysRemaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Expired Warranty">
            {!(assetComputed?.expired || []).length ? (
              <div className="empty-state">No expired warranties</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Asset Tag</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Department</th>
                      <th>Warranty Expiry</th>
                      <th>Days Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assetComputed?.expired || []).map((a) => (
                      <tr key={a?._id || a?.assetTag} className="um-row-hover">
                        <td>{a?.assetTag}</td>
                        <td>{a?.name}</td>
                        <td>{a?.category}</td>
                        <td>{a?.department || '-'}</td>
                        <td>{formatDate(a?.warrantyExpiryDate ?? a?.warrantyExpiry)}</td>
                        <td>{a?.daysOverdue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      );
    } catch {
      return (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <FiAlertCircle />
              <p>Unable to load asset report. Please refresh the page.</p>
              <button className="btn btn-primary" type="button" onClick={() => fetchAssetsReport()}>
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  const navItems = [
    { key: SECTION.OVERVIEW, title: 'Dashboard Overview', desc: 'Global KPI snapshot and critical issues', icon: FiGrid, adminOnly: false },
    { key: SECTION.TICKETS, title: 'Ticket Reports', desc: 'Status, priority, trends and resolution metrics', icon: FiBarChart2, adminOnly: false },
    { key: SECTION.ASSETS, title: 'Asset Reports', desc: 'Inventory value, warranty and maintenance analytics', icon: FiBox, adminOnly: false },
    { key: SECTION.USERS, title: 'User Reports', desc: 'Role/department distribution and top submitters', icon: FiUsers, adminOnly: true },
    { key: SECTION.PERFORMANCE, title: 'Performance Reports', desc: 'Officer productivity and resolution rates', icon: FiTrendingUp, adminOnly: true },
  ].filter((i) => (i.adminOnly ? isAdmin : true));

  const renderError = (message, retry) => (
    <div className="card">
      <div className="card-body">
        <div className="empty-state">
          <FiAlertCircle />
          <p>{message}</p>
          <button className="btn btn-primary" onClick={retry} type="button">
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  const topSubmitters = useMemo(() => {
    const map = new Map();
    allTickets.forEach((t) => {
      const u = t.submittedBy || {};
      const id = u._id || `deleted-${t._id}`;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: u.name || 'Deleted User',
          email: u.email || '-',
          role: u.role || 'deleted',
          department: u.department || '-',
          count: 0,
          deleted: !u._id,
        });
      }
      map.get(id).count += 1;
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [allTickets]);

  const assetComputed = useMemo(() => {
    const now = Date.now();
    const in30 = [];
    const expired = [];
    const conditionMap = new Map();
    const maintenance = { records: 0, cost: 0 };
    const valueByCategory = new Map();
    let totalPurchaseValue = 0;

    (Array.isArray(allAssets) ? allAssets : []).forEach((a) => {
      if (!a || typeof a !== 'object') return;
      const condition = a.condition || 'Unknown';
      conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1);
      const cat = a.category || 'Uncategorized';
      const price = Number(a.purchasePrice || 0);
      totalPurchaseValue += price;
      valueByCategory.set(cat, (valueByCategory.get(cat) || 0) + price);
      const warrantyRaw = a.warrantyExpiryDate ?? a.warrantyExpiry;
      const wr = warrantyRaw ? new Date(warrantyRaw).getTime() : NaN;
      if (!Number.isNaN(wr)) {
        const days = Math.ceil((wr - now) / (1000 * 60 * 60 * 24));
        if (days < 0) expired.push({ ...a, daysOverdue: Math.abs(days) });
        else if (days <= 30) in30.push({ ...a, daysRemaining: days });
      }
      const m = Array.isArray(a.maintenanceHistory) ? a.maintenanceHistory : [];
      maintenance.records += m.length;
      maintenance.cost += (m || []).reduce((s, it) => s + Number(it?.cost ?? 0), 0);
    });
    return {
      byCondition: [...conditionMap.entries()].map(([label, count]) => ({ label, count })),
      valueByCategory: [...valueByCategory.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      expiringSoon: in30.sort((a, b) => a.daysRemaining - b.daysRemaining),
      expired: expired.sort((a, b) => b.daysOverdue - a.daysOverdue),
      maintenance,
      totalPurchaseValue,
    };
  }, [allAssets]);

  const monthlyTrendRows = useMemo(() => {
    const rows = (ticketData?.byMonth || []).map((m) => ({
      label: `${MONTHS[(m?._id?.month || 1) - 1]} ${m?._id?.year || ''}`,
      count: Number(m?.count || 0),
      month: m?._id?.month || 1,
      year: m?._id?.year || 0,
    }));
    return rows;
  }, [ticketData]);

  const ticketResolutionTimes = useMemo(() => {
    const withTimes = allTickets
      .filter((t) => (t.status === 'Resolved' || t.status === 'Closed') && t.createdAt && t.updatedAt)
      .map((t) => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        if (Number.isNaN(created) || Number.isNaN(updated) || updated < created) return null;
        return (updated - created) / (1000 * 60 * 60);
      })
      .filter((x) => x !== null);
    if (!withTimes.length) return { avg: 0, min: 0, max: 0 };
    const total = withTimes.reduce((a, b) => a + b, 0);
    return {
      avg: total / withTimes.length,
      min: Math.min(...withTimes),
      max: Math.max(...withTimes),
    };
  }, [allTickets]);

  if (!isPrivileged) return null;

  return (
    <section className="um-page" aria-label="Reports and analytics">
      <header className="page-header">
        <div>
          <h1 className="um-title">Reports & Analytics</h1>
          <p className="um-subtitle">
            Monitor ICT performance, ticket trends and asset health across all departments
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: '0.84rem' }}>
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}
          </span>
          <button type="button" className="btn btn-primary" onClick={onRefreshActive}>
            <FiRefreshCw /> Refresh Data
          </button>
        </div>
      </header>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className="stat-card"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: active ? '#2563eb' : 'var(--border)',
                boxShadow: active ? '0 0 0 2px rgba(37,99,235,0.16)' : undefined,
              }}
              onClick={() => setActiveSection(item.key)}
            >
              <span className="stat-icon" style={{ background: active ? 'rgba(37, 99, 235, 0.16)' : undefined }}>
                <Icon />
              </span>
              <span>
                <p className="stat-value" style={{ fontSize: '1rem' }}>
                  {item.title}
                </p>
                <p className="stat-label">{item.desc}</p>
              </span>
            </button>
          );
        })}
      </div>

      {activeSection === SECTION.OVERVIEW && (
        <>
          {overviewLoading && <div className="spinner-wrap"><div className="spinner" /></div>}
          {!overviewLoading && overviewError && renderError(overviewError, fetchOverview)}
          {!overviewLoading && !overviewError && overviewData && (
            <>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                {[
                  ['Total Tickets', overviewData?.tickets?.total || 0, FiLayers, '#2563eb'],
                  ['Open Tickets', overviewData?.tickets?.open || 0, FiAlertCircle, '#f97316'],
                  ['In Progress', overviewData?.tickets?.inProgress || 0, FiClock, '#eab308'],
                  ['Resolved Tickets', overviewData?.tickets?.resolved || 0, FiActivity, '#16a34a'],
                  ['Closed Tickets', overviewData?.tickets?.closed || 0, FiLayers, '#9ca3af'],
                ].map(([label, value, Icon, color]) => (
                  <article key={label} className="stat-card">
                    <span className="stat-icon" style={{ color, background: `${color}20` }}>
                      <Icon />
                    </span>
                    <span>
                      <p className="stat-value">{value}</p>
                      <p className="stat-label">{label}</p>
                    </span>
                  </article>
                ))}
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {[
                  ['Total Users', overviewData?.users?.total || 0, FiUsers, '#7c3aed'],
                  ['Total Assets', overviewData?.assets?.total || 0, FiBox, '#0d9488'],
                  [
                    'Critical Tickets',
                    Array.isArray(overviewData?.criticalTickets) ? overviewData.criticalTickets.length : 0,
                    FiAlertCircle,
                    '#dc2626',
                  ],
                ].map(([label, value, Icon, color]) => (
                  <article key={label} className="stat-card">
                    <span className="stat-icon" style={{ color, background: `${color}20` }}>
                      <Icon />
                    </span>
                    <span>
                      <p className="stat-value">{value}</p>
                      <p className="stat-label">{label}</p>
                    </span>
                  </article>
                ))}
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: '3fr 2fr' }}>
                <SectionCard
                  title="Recent Tickets"
                  right={<Link to="/tickets" className="btn btn-sm">View All Tickets</Link>}
                >
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Ticket No</th><th>Title</th><th>Status</th><th>Priority</th><th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(overviewData.recentTickets || []).slice(0, 5).map((t) => (
                          <tr key={t._id} className="um-row-hover">
                            <td>{t.ticketNumber}</td>
                            <td>{t.title}</td>
                            <td><span className={`badge ${badgeStatus(t.status)}`}>{t.status}</span></td>
                            <td><span className={`badge ${badgePriority(t.priority)}`}>{t.priority}</span></td>
                            <td>{formatDate(t.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                <SectionCard title="Critical Tickets Requiring Attention" right={<Link to="/tickets" className="btn btn-sm">View All</Link>}>
                  {!(overviewData.criticalTickets || []).length ? (
                    <div className="empty-state">No critical tickets. All good!</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {overviewData.criticalTickets.map((t) => (
                        <div key={t._id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <strong style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{t.ticketNumber}</strong>
                            <span className={`badge ${badgeStatus(t.status)}`}>{t.status}</span>
                          </div>
                          <p style={{ margin: '4px 0', color: 'var(--text)' }}>{t.title}</p>
                          <span className="muted" style={{ fontSize: '0.8rem' }}>{formatDate(t.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            </>
          )}
        </>
      )}

      {activeSection === SECTION.TICKETS && (
        <>
          <SectionCard title="Date Range Filter">
            <div className="um-filter-grid" style={{ gridTemplateColumns: '1fr 1fr auto auto' }}>
              <input type="date" className="um-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input type="date" className="um-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <button className="btn btn-primary" type="button" onClick={() => fetchTicketsReport(true)}>Generate Report</button>
              <button className="btn btn-secondary" type="button" onClick={() => { setStartDate(''); setEndDate(''); setTicketError(''); fetchTicketsReport(false); }}>Clear Filter</button>
            </div>
            {ticketError && <p className="um-form-error" style={{ marginTop: 8 }}>{ticketError}</p>}
          </SectionCard>

          {ticketLoading && <div className="spinner-wrap"><div className="spinner" /></div>}
          {!ticketLoading && ticketError && !ticketData && renderError(ticketError, () => fetchTicketsReport(false))}
          {!ticketLoading && ticketData && (
            <>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                {[
                  ['Total Tickets', ticketData?.summary?.total || 0],
                  ['Open', ticketData?.summary?.open || 0],
                  ['In Progress', (ticketData?.byStatus || []).find((x) => x._id === 'In Progress')?.count || 0],
                  ['Resolved', ticketData?.summary?.resolved || 0],
                  ['Closed', ticketData?.summary?.closed || 0],
                ].map(([label, value]) => (
                  <article key={label} className="stat-card"><span><p className="stat-value">{value}</p><p className="stat-label">{label}</p></span></article>
                ))}
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <SectionCard title="Tickets by Status">
                  <BarRows rows={toRows(ticketData.byStatus)} total={ticketData?.summary?.total || 0} colorFn={barColorStatus} />
                </SectionCard>
                <SectionCard title="Tickets by Priority">
                  <BarRows rows={toRows(ticketData.byPriority)} total={ticketData?.summary?.total || 0} colorFn={barColorPriority} />
                </SectionCard>
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <SectionCard title="Tickets by Category">
                  <BarRows
                    rows={toRows(ticketData.byCategory).sort((a, b) => b.count - a.count)}
                    total={ticketData?.summary?.total || 0}
                    colorFn={() => '#2563eb'}
                  />
                </SectionCard>
                <SectionCard title="Tickets by Department">
                  {(ticketData?.byDepartment || []).length ? (
                    <BarRows
                      rows={toRows(ticketData.byDepartment).sort((a, b) => b.count - a.count)}
                      total={ticketData?.summary?.total || 0}
                      colorFn={() => '#0ea5e9'}
                    />
                  ) : <div className="empty-state">No department data</div>}
                </SectionCard>
              </div>

              <SectionCard title="Monthly Ticket Trend">
                {!monthlyTrendRows.length ? (
                  <div className="empty-state">No monthly trend data</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${monthlyTrendRows.length}, minmax(56px, 1fr))`, gap: 10, alignItems: 'end' }}>
                    {monthlyTrendRows.map((m) => {
                      const max = Math.max(...monthlyTrendRows.map((x) => x.count), 1);
                      const h = (m.count / max) * 180;
                      return (
                        <div key={`${m.year}-${m.month}`} style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.count}</span>
                          <div style={{ width: 28, height: Math.max(h, 6), borderRadius: 6, background: '#2563eb' }} />
                          <span style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{MONTHS[m.month - 1]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Resolution Time">
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  {[
                    ['Average Resolution Time', formatDuration(ticketResolutionTimes.avg)],
                    ['Minimum Resolution Time', formatDuration(ticketResolutionTimes.min)],
                    ['Maximum Resolution Time', formatDuration(ticketResolutionTimes.max)],
                  ].map(([label, value]) => (
                    <article key={label} className="stat-card">
                      <span>
                        <p className="stat-value" style={{ fontSize: '1.25rem' }}>{value}</p>
                        <p className="stat-label">{label}</p>
                      </span>
                    </article>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Export">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => toast('Export feature coming soon')} type="button"><FiDownload /> Export as PDF</button>
                  <button className="btn btn-secondary" onClick={() => toast('Export feature coming soon')} type="button"><FiDownload /> Export as Excel</button>
                </div>
              </SectionCard>
            </>
          )}
        </>
      )}

      {activeSection === SECTION.ASSETS && renderAssetsReportSection()}

      {activeSection === SECTION.PERFORMANCE && isAdmin && (
        <>
          {performanceLoading && <div className="spinner-wrap"><div className="spinner" /></div>}
          {!performanceLoading && performanceError && renderError(performanceError, fetchPerformance)}
          {!performanceLoading && !performanceError && (
            <>
              <SectionCard title="ICT Officer performance metrics based on ticket resolution">
                {!performanceData.length ? (
                  <div className="empty-state">No performance data yet</div>
                ) : (
                  <article className="stat-card" style={{ alignItems: 'flex-start' }}>
                    <span className="badge badge-ict">Top Performer</span>
                    <div>
                      <p className="stat-value" style={{ fontSize: '1.2rem' }}>{performanceData[0].officerName}</p>
                      <p className="stat-label">
                        Resolution rate {performanceData[0].resolutionRate || 0}% • Resolved {performanceData[0].resolved || 0}
                      </p>
                    </div>
                  </article>
                )}
              </SectionCard>

              <SectionCard title="Performance Table">
                {!performanceData.length ? (
                  <div className="empty-state">No performance data yet</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Officer</th><th>Role</th><th>Total Assigned</th><th>Resolved</th><th>Closed</th><th>In Progress</th><th>Avg Resolution</th><th>Resolution Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceData.map((r) => {
                          const rate = Number(r.resolutionRate || 0);
                          const avg = r.totalAssigned > 0 ? (r.resolved + r.closed > 0 ? (r.totalAssigned / Math.max(r.resolved + r.closed, 1)) * 8 : 0) : 0;
                          return (
                            <tr key={r._id || r.officerEmail} className="um-row-hover">
                              <td>
                                <div><strong>{r.officerName}</strong></div>
                                <div className="muted" style={{ fontSize: '0.8rem' }}>{r.officerEmail}</div>
                              </td>
                              <td><span className="badge badge-ict">ICT Officer</span></td>
                              <td>{r.totalAssigned}</td>
                              <td><span style={{ color: '#16a34a', fontWeight: 700 }}>{r.resolved}</span></td>
                              <td><span style={{ color: '#6b7280', fontWeight: 700 }}>{r.closed}</span></td>
                              <td><span style={{ color: '#d97706', fontWeight: 700 }}>{r.inProgress}</span></td>
                              <td>{formatDuration(avg)}</td>
                              <td>
                                <div style={{ display: 'grid', gap: 6 }}>
                                  <div style={{ background: '#f1f5f9', borderRadius: 4, height: 10 }}>
                                    <div style={{ background: rateColor(rate), borderRadius: 4, width: `${Math.min(rate, 100)}%`, height: '100%' }} />
                                  </div>
                                  <span className="muted" style={{ fontSize: '0.8rem' }}>{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </>
      )}

      {activeSection === SECTION.USERS && isAdmin && (
        <>
          {userLoading && <div className="spinner-wrap"><div className="spinner" /></div>}
          {!userLoading && userError && renderError(userError, fetchUsers)}
          {!userLoading && !userError && userReport && (
            <>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                <article className="stat-card"><span><p className="stat-value">{userReport?.summary?.totalUsers || 0}</p><p className="stat-label">Total Users</p></span></article>
                <article className="stat-card"><span><p className="stat-value" style={{ color: '#16a34a' }}>{userReport?.summary?.activeUsers || 0}</p><p className="stat-label">Active Users</p></span></article>
                <article className="stat-card"><span><p className="stat-value" style={{ color: '#dc2626' }}>{userReport?.summary?.inactiveUsers || 0}</p><p className="stat-label">Inactive Users</p></span></article>
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <SectionCard title="Users by Role">
                  <BarRows rows={toRows(userReport.byRole)} total={userReport?.summary?.totalUsers || 0} colorFn={(k) => {
                    if (k === 'admin') return '#7c3aed';
                    if (k === 'ict_officer') return '#2563eb';
                    if (k === 'staff') return '#22c55e';
                    if (k === 'student') return '#eab308';
                    return '#64748b';
                  }} />
                </SectionCard>
                <SectionCard title="Users by Department">
                  <BarRows rows={toRows(userReport.byDepartment).sort((a, b) => b.count - a.count)} total={userReport?.summary?.totalUsers || 0} colorFn={() => '#0ea5e9'} />
                </SectionCard>
              </div>

              <SectionCard title="Top Ticket Submitters">
                {!topSubmitters.length ? (
                  <div className="empty-state">No submitter data available</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>User Name</th><th>Email</th><th>Role</th><th>Department</th><th>Ticket Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSubmitters.map((u, idx) => (
                          <tr key={u.id} className="um-row-hover" style={{ background: idx === 0 ? '#eff6ff' : undefined }}>
                            <td>
                              {u.deleted ? (
                                <em style={{ color: '#9ca3af' }}>Deleted User</em>
                              ) : (
                                u.name
                              )}
                            </td>
                            <td>{u.email}</td>
                            <td><span className={`badge ${badgeRole(u.role)}`}>{u.role}</span></td>
                            <td>{u.department || '-'}</td>
                            <td style={{ fontWeight: 800 }}>{u.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default Reports;
