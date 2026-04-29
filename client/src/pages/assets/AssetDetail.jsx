import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiMinusCircle,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import API from '../../api/axios';

const formatKES = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return 'KES 0';
  return `KES ${new Intl.NumberFormat('en-KE').format(n)}`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
};

const getWarrantyState = (warrantyExpiry) => {
  if (!warrantyExpiry) return { label: 'None', bg: 'rgba(148,163,184,0.16)', color: '#475569' };
  const exp = new Date(warrantyExpiry);
  if (Number.isNaN(exp.getTime())) return { label: 'None', bg: 'rgba(148,163,184,0.16)', color: '#475569' };
  const now = new Date();
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', bg: 'rgba(220,38,38,0.16)', color: '#991b1b' };
  if (diffDays <= 30) return { label: 'Expiring Soon', bg: 'rgba(245,158,11,0.16)', color: '#92400e' };
  return { label: 'Valid', bg: 'rgba(34,197,94,0.14)', color: '#166534' };
};

const conditionMeta = (condition) => {
  const c = condition || '';
  if (c === 'New') return { bg: 'rgba(34,197,94,0.14)', color: '#166534' };
  if (c === 'Good') return { bg: 'rgba(37,99,235,0.14)', color: '#1d4ed8' };
  if (c === 'Fair') return { bg: 'rgba(245,158,11,0.16)', color: '#92400e' };
  if (c === 'Poor') return { bg: 'rgba(249,115,22,0.16)', color: '#9a3412' };
  if (c === 'Faulty') return { bg: 'rgba(220,38,38,0.16)', color: '#991b1b' };
  if (c === 'Decommissioned') return { bg: 'rgba(148,163,184,0.2)', color: '#334155' };
  return { bg: 'rgba(148,163,184,0.2)', color: '#475569' };
};

const statusBadge = (status) => {
  if (status === 'Available') return { cls: 'badge-resolved', label: 'Available' };
  if (status === 'Assigned') return { cls: 'badge-open', label: 'Assigned' };
  if (status === 'Under Repair') return { cls: 'badge-progress', label: 'Under Repair' };
  return { cls: 'badge-closed', label: 'Decommissioned' };
};

const AssetDetail = () => {
  const user = useSelector((s) => s.auth.user);
  const role = user?.role;
  const navigate = useNavigate();
  const { id } = useParams();

  const isAuthorized = role === 'admin' || role === 'ict_officer';
  const isAdmin = role === 'admin';

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    description: '',
    condition: 'Good',
    cost: '',
    nextMaintenanceDate: '',
  });
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');

  const [assignUsers, setAssignUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [assignToId, setAssignToId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);
  const [unassignLoading, setUnassignLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchAsset = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get(`/assets/${id}`);
      setAsset(data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load asset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) {
      toast.error('Not authorized');
      navigate('/dashboard');
      return;
    }
    fetchAsset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, id]);

  useEffect(() => {
    if (!asset) return;
    // Fetch users for assignment dropdown (all users)
    const loadUsers = async () => {
      try {
        // Assignment dropdown should list ICT officers
        const { data } = await API.get('/users', { params: { role: 'ict_officer' } });
        setAssignUsers(data?.data || []);
      } catch {
        setAssignUsers([]);
      }
    };
    loadUsers();
  }, [asset]);

  const warrantyMeta = getWarrantyState(asset?.warrantyExpiry);
  const sBadge = statusBadge(asset?.status);
  const cond = conditionMeta(asset?.condition);
  const isUnderRepair = asset?.status === 'Under Repair';
  const isDecommissioned = asset?.status === 'Decommissioned';

  const maintenanceHistory = Array.isArray(asset?.maintenanceHistory)
    ? asset.maintenanceHistory
    : [];

  const totalMaintenanceCost = useMemo(
    () => maintenanceHistory.reduce((sum, r) => sum + Number(r?.cost || 0), 0),
    [maintenanceHistory]
  );

  const isUnderWarranty = useMemo(() => {
    if (!asset?.warrantyExpiry) return false;
    const exp = new Date(asset.warrantyExpiry);
    if (Number.isNaN(exp.getTime())) return false;
    return exp.getTime() >= Date.now();
  }, [asset?.warrantyExpiry]);

  const assignable = !isUnderRepair && !isDecommissioned;
  const assignedUser = asset?.assignedTo || null;

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return assignUsers;
    return assignUsers.filter((u) => {
      const name = (u?.name || '').toLowerCase();
      const email = (u?.email || '').toLowerCase();
      const dept = (u?.department || '').toLowerCase();
      return name.includes(term) || email.includes(term) || dept.includes(term);
    });
  }, [assignUsers, userSearch]);

  const onAddMaintenance = async (e) => {
    e.preventDefault();
    if (!asset?._id) return;
    setMaintenanceError('');

    if (!maintenanceForm.description.trim()) {
      setMaintenanceError('Description is required.');
      return;
    }
    if (!maintenanceForm.cost || Number.isNaN(Number(maintenanceForm.cost))) {
      setMaintenanceError('Cost is required and must be a number.');
      return;
    }

    setMaintenanceSaving(true);
    try {
      await API.post(`/assets/${asset._id}/maintenance`, {
        description: maintenanceForm.description.trim(),
        cost: Number(maintenanceForm.cost),
        nextMaintenanceDate: maintenanceForm.nextMaintenanceDate || undefined,
        condition: maintenanceForm.condition || undefined,
      });
      toast.success('Maintenance record added');
      setMaintenanceModal(false);
      setMaintenanceForm({
        description: '',
        condition: 'Good',
        cost: '',
        nextMaintenanceDate: '',
      });
      await fetchAsset();
    } catch (err) {
      setMaintenanceError(err?.response?.data?.message || 'Failed to add maintenance record.');
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const onAssign = async () => {
    if (!asset?._id) return;
    if (!assignToId) {
      toast.error('Select a user to assign.');
      return;
    }
    setAssignError('');
    setAssignLoading(true);
    try {
      await API.put(`/assets/${asset._id}/assign`, { userId: assignToId });
      toast.success(`Asset assigned successfully`);
      setAssignToId('');
      setUserSearch('');
      await fetchAsset();
    } catch (err) {
      setAssignError(err?.response?.data?.message || 'Failed to assign asset.');
    } finally {
      setAssignLoading(false);
    }
  };

  const onUnassign = async () => {
    if (!asset?._id) return;
    setUnassignLoading(true);
    try {
      await API.put(`/assets/${asset._id}/unassign`);
      toast.success('Asset unassigned successfully');
      setUnassignConfirmOpen(false);
      await fetchAsset();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to unassign asset.');
    } finally {
      setUnassignLoading(false);
    }
  };

  const onDeleteAsset = async () => {
    if (!asset?._id) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await API.delete(`/assets/${asset._id}`);
      toast.success('Asset deleted successfully');
      navigate('/assets');
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete asset.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="um-page" aria-label="Asset details loading">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </section>
    );
  }

  if (error || !asset) {
    return (
      <section className="um-page" aria-label="Asset details error">
        <div className="empty-state">
          <FiAlertTriangle />
          <p>{error || 'Asset not found'}</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/assets')}>
            Back to Assets
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="um-page" aria-label="Asset detail">
      <div className="page-header">
        <div>
          <h1 className="um-title" style={{ marginBottom: 6 }}>{asset.name}</h1>
          <p className="um-subtitle">
            <span style={{ fontFamily: 'monospace', fontWeight: 800, marginRight: 10 }}>
              {asset.assetTag}
            </span>
            <span className={`badge ${sBadge.cls}`} style={{ marginRight: 8 }}>{sBadge.label}</span>
            <span className="badge" style={{ background: cond.bg, color: cond.color, borderColor: 'transparent' }}>
              {asset.condition || '-'}
            </span>
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            <span><strong style={{ color: 'var(--text)' }}>Category:</strong> {asset.category || '-'}</span>
            <span><strong style={{ color: 'var(--text)' }}>Brand:</strong> {asset.brand || '-'}</span>
            <span><strong style={{ color: 'var(--text)' }}>Model:</strong> {asset.model || '-'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/assets" className="btn btn-secondary btn-sm">
            Back
          </Link>
          {isAdmin && (
            <button type="button" className="btn btn-sm um-delete-btn" onClick={() => setDeleteConfirmOpen(true)}>
              <FiTrash2 /> Delete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 60%', minWidth: 320 }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2 className="card-title">Specifications</h2>
              <span className="badge" style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'transparent' }}>
                {asset.category}
              </span>
            </div>
            <div className="card-body" style={{ lineHeight: 1.6, color: 'var(--text)' }}>
              {asset.specifications || '-'}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Maintenance History</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setMaintenanceModal(true)}
              >
                <FiPlus /> Add Maintenance Record
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {maintenanceHistory.length ? (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Performed By</th>
                          <th>Cost (KES)</th>
                          <th>Next Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintenanceHistory
                          .slice()
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((r, idx) => (
                            <tr key={r._id || idx} className="um-row-hover">
                              <td>{formatDate(r.createdAt)}</td>
                              <td>{r.description}</td>
                              <td>{r.performedBy?.name || r.performedByName || '-'}</td>
                              <td>{formatKES(r.cost || 0)}</td>
                              <td>{r.nextMaintenanceDate ? formatDate(r.nextMaintenanceDate) : '-'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <strong>Total Maintenance Cost</strong>
                      <span className="badge" style={{ background: 'rgba(37,99,235,0.10)', borderColor: 'transparent', color: '#1d4ed8' }}>
                        {formatKES(totalMaintenanceCost)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ minHeight: 180, padding: 18 }}>
                  <FiBookOpen />
                  <p>No maintenance records yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 40%', minWidth: 320 }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2 className="card-title">Asset Details</h2>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: 10 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Serial Number:</strong> {asset.serialNumber || '-'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Location:</strong> {asset.location || '-'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Department:</strong> {asset.department || '-'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Purchase Date:</strong> {asset.purchaseDate ? formatDate(asset.purchaseDate) : '-'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Purchase Price:</strong> {formatKES(asset.purchasePrice || 0)}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Vendor:</strong> {asset.vendor || '-'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Warranty Expiry:</strong>{' '}
                <span className="badge" style={{ background: warrantyMeta.bg, borderColor: 'transparent', color: warrantyMeta.color }}>
                  {warrantyMeta.label}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Added By:</strong> {asset.addedBy?.name || '-'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                <strong style={{ color: 'var(--text)' }}>Date Added:</strong> {asset.createdAt ? formatDate(asset.createdAt) : '-'}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2 className="card-title">Assignment</h2>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  <strong style={{ color: 'var(--text)' }}>Assigned To:</strong> {assignedUser ? assignedUser.name : 'Not Assigned'}
                </div>
                {assignedUser?.department ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: 2 }}>{assignedUser.department}</div>
                ) : null}
                {assignedUser?.email ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: 2 }}>{assignedUser.email}</div>
                ) : null}
              </div>

              {!assignable && (
                <div className="empty-state" style={{ minHeight: 60, padding: 0 }}>
                  <FiAlertTriangle />
                  <p>
                    {isDecommissioned ? 'This asset is decommissioned.' : 'This asset is under repair.'} Assignment changes are disabled.
                  </p>
                </div>
              )}

              {assignable && !assignedUser && (
                <>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Assign Asset</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <FiSearch />
                        <input
                          className="um-input"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search users"
                        />
                      </div>
                      <select className="um-select" value={assignToId} onChange={(e) => setAssignToId(e.target.value)}>
                        <option value="">Select user</option>
                        {filteredUsers.slice(0, 50).map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.email || '—'}) - {u.department || '-'}
                          </option>
                        ))}
                      </select>
                    </div>
                    {assignError ? <p className="um-form-error">{assignError}</p> : null}
                  </div>
                  <button type="button" className="btn btn-primary" onClick={onAssign} disabled={assignLoading || !assignToId}>
                    <FiUsers /> {assignLoading ? 'Assigning...' : `Assign to ${filteredUsers.find((u) => u._id === assignToId)?.name || 'User'}`}
                  </button>
                </>
              )}

              {assignable && assignedUser && (
                <>
                  <button type="button" className="btn btn-secondary" onClick={() => setUnassignConfirmOpen(true)} disabled={unassignLoading}>
                    <FiMinusCircle /> Unassign Asset
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Virtual Fields</h2>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Is Under Warranty</span>
                <span
                  className="badge"
                  style={{
                    background: isUnderWarranty ? 'rgba(34,197,94,0.14)' : 'rgba(148,163,184,0.2)',
                    borderColor: 'transparent',
                    color: isUnderWarranty ? '#166534' : '#334155',
                  }}
                >
                  {isUnderWarranty ? 'Yes' : 'No'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Maintenance Cost</span>
                <span className="badge" style={{ background: 'rgba(37,99,235,0.10)', borderColor: 'transparent', color: '#1d4ed8' }}>
                  {formatKES(totalMaintenanceCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {maintenanceModal && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Add Maintenance Record</h2>
              <button type="button" className="btn btn-sm" onClick={() => setMaintenanceModal(false)} disabled={maintenanceSaving}>
                <FiX /> Close
              </button>
            </div>
            <form className="card-body um-form-grid" onSubmit={onAddMaintenance}>
              <input
                className="um-input"
                placeholder="Description *"
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm((p) => ({ ...p, description: e.target.value }))}
              />
              <select
                className="um-select"
                value={maintenanceForm.condition}
                onChange={(e) => setMaintenanceForm((p) => ({ ...p, condition: e.target.value }))}
              >
                {['New', 'Good', 'Fair', 'Poor', 'Faulty'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                className="um-input"
                placeholder="Cost (KES) *"
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm((p) => ({ ...p, cost: e.target.value }))}
              />
              <input
                className="um-input"
                type="date"
                value={maintenanceForm.nextMaintenanceDate}
                onChange={(e) => setMaintenanceForm((p) => ({ ...p, nextMaintenanceDate: e.target.value }))}
              />
              {maintenanceError ? <p className="um-form-error">{maintenanceError}</p> : null}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setMaintenanceModal(false)} disabled={maintenanceSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={maintenanceSaving}>
                  {maintenanceSaving ? 'Adding...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {unassignConfirmOpen && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Unassign Asset</h2>
              <button type="button" className="btn btn-sm" onClick={() => setUnassignConfirmOpen(false)} disabled={unassignLoading}>
                <FiX /> Close
              </button>
            </div>
            <div className="card-body">
              <p style={{ marginTop: 0 }}>
                Are you sure you want to unassign this asset from <strong>{assignedUser?.name || 'the user'}</strong>?
              </p>
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setUnassignConfirmOpen(false)} disabled={unassignLoading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={onUnassign} disabled={unassignLoading}>
                  {unassignLoading ? 'Unassigning...' : 'Unassign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Delete Asset</h2>
              <button type="button" className="btn btn-sm" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>
                <FiX /> Close
              </button>
            </div>
            <div className="card-body">
              <p style={{ marginTop: 0 }}>
                Are you sure you want to delete asset <strong>{asset.assetTag}</strong>? This action cannot be undone.
              </p>
              {deleteError ? <p className="um-form-error">{deleteError}</p> : null}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={onDeleteAsset} disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AssetDetail;