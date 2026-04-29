import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiBox,
  FiEdit2,
  FiFile,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTool,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import API from '../../api/axios';

const STATUS_TO_BADGE = {
  Available: { cls: 'badge-resolved', label: 'Available' }, // green
  Assigned: { cls: 'badge-open', label: 'Assigned' }, // blue
  'Under Repair': { cls: 'badge-progress', label: 'Under Repair' }, // orange
  Decommissioned: { cls: 'badge-closed', label: 'Decommissioned' }, // grey
};

const CONDITION_TO_BADGE = {
  New: { bg: 'rgba(34,197,94,0.14)', color: '#166534' },
  Good: { bg: 'rgba(37,99,235,0.14)', color: '#1d4ed8' },
  Fair: { bg: 'rgba(245,158,11,0.16)', color: '#92400e' },
  Poor: { bg: 'rgba(249,115,22,0.16)', color: '#9a3412' },
  Faulty: { bg: 'rgba(220,38,38,0.16)', color: '#991b1b' },
  Decommissioned: { bg: 'rgba(148,163,184,0.2)', color: '#334155' },
};

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

const AssetList = () => {
  const user = useSelector((s) => s.auth.user);
  const role = user?.role;
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');

  const [visibleCount, setVisibleCount] = useState(20);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [stats, setStats] = useState({ total: 0, available: 0, assigned: 0, underRepair: 0 });

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalError, setModalError] = useState('');

  const [createForm, setCreateForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [deleteAssetModal, setDeleteAssetModal] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isAuthorized = role === 'admin' || role === 'ict_officer';

  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Available', value: 'Available' },
    { label: 'Assigned', value: 'Assigned' },
    { label: 'Under Repair', value: 'Under Repair' },
    { label: 'Decommissioned', value: 'Decommissioned' },
  ];

  const categoryOptions = [
    'Desktop Computer',
    'Laptop',
    'Printer',
    'Scanner',
    'Projector',
    'Network Switch',
    'Router',
    'UPS',
    'Monitor',
    'Server',
    'Telephone',
    'Other',
  ];

  const conditionOptions = [
    { label: 'All Conditions', value: '' },
    { label: 'New', value: 'New' },
    { label: 'Good', value: 'Good' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Poor', value: 'Poor' },
    { label: 'Faulty', value: 'Faulty' },
    { label: 'Decommissioned', value: 'Decommissioned' },
  ];

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/assets/stats');
      const byStatus = data?.data?.byStatus || [];
      const find = (id) => byStatus.find((x) => x._id === id)?.count || 0;
      setStats({
        total: data?.data?.total ?? byStatus.reduce((acc, x) => acc + (x.count || 0), 0),
        available: find('Available'),
        assigned: find('Assigned'),
        underRepair: find('Under Repair'),
      });
    } catch {
      // keep list usable
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (conditionFilter) params.condition = conditionFilter;

      const { data } = await API.get('/assets', { params });
      const list = data?.data || [];
      setAssets(list);

      const nextDepts = Array.from(new Set(list.map((a) => a.department).filter(Boolean))).sort();
      const nextCats = Array.from(new Set(list.map((a) => a.category).filter(Boolean))).sort();
      setDepartments(nextDepts);
      setCategories(nextCats);

      setVisibleCount(20);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load assets.');
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
    fetchAssets();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, categoryFilter, departmentFilter, conditionFilter]);

  const emptyState = (
    <div className="empty-state">
      <FiBox />
      <p>No assets found</p>
      <button className="btn btn-primary btn-sm" type="button" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setDepartmentFilter(''); setConditionFilter(''); }}>
        <FiRefreshCw /> Clear Filters
      </button>
    </div>
  );

  const openCreate = () => {
    setModalError('');
    setCreateForm({
      name: '',
      category: '',
      brand: '',
      model: '',
      serialNumber: '',
      specifications: '',
      condition: 'Good',
      location: '',
      department: '',
      purchaseDate: '',
      purchasePrice: '',
      vendor: '',
      warrantyExpiry: '',
      notes: '',
    });
    setShowCreate(true);
  };

  const openEdit = (asset) => {
    setModalError('');
    setSelectedAsset(asset);
    setEditForm({
      name: asset.name || '',
      category: asset.category || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      specifications: asset.specifications || '',
      condition: asset.condition || 'Good',
      location: asset.location || '',
      department: asset.department || '',
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().slice(0, 10) : '',
      purchasePrice: asset.purchasePrice ?? '',
      vendor: asset.vendor || '',
      warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().slice(0, 10) : '',
      notes: asset.notes || '',
    });
    setShowEdit(true);
  };

  const closeModals = () => {
    setShowCreate(false);
    setShowEdit(false);
    setSelectedAsset(null);
    setModalSubmitting(false);
    setModalError('');
  };

  const onCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!createForm.name.trim() || !createForm.category) {
      setModalError('Asset Name and Category are required.');
      return;
    }

    setModalSubmitting(true);
    try {
      await API.post('/assets', {
        ...createForm,
        purchasePrice: createForm.purchasePrice === '' ? 0 : Number(createForm.purchasePrice),
        purchaseDate: createForm.purchaseDate || undefined,
        warrantyExpiry: createForm.warrantyExpiry || undefined,
      });
      toast.success('Asset created successfully');
      closeModals();
      await fetchAssets();
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to create asset.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset?._id) return;
    setModalError('');
    setModalSubmitting(true);
    try {
      await API.put(`/assets/${selectedAsset._id}`, {
        ...editForm,
        purchasePrice: editForm.purchasePrice === '' ? 0 : Number(editForm.purchasePrice),
        purchaseDate: editForm.purchaseDate || undefined,
        warrantyExpiry: editForm.warrantyExpiry || undefined,
      });
      toast.success('Asset updated successfully');
      closeModals();
      await fetchAssets();
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to update asset.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const openDelete = (asset) => {
    setDeleteAssetId(asset._id);
    setDeleteAssetModal(true);
    setDeleteError('');
  };

  const onDelete = async () => {
    if (!deleteAssetId) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await API.delete(`/assets/${deleteAssetId}`);
      toast.success('Asset deleted successfully');
      setDeleteAssetModal(false);
      setDeleteAssetId(null);
      await fetchAssets();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete asset.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const conditionBadge = (condition) => {
    const meta = CONDITION_TO_BADGE[condition] || { bg: 'rgba(148,163,184,0.16)', color: '#475569' };
    return (
      <span className="badge" style={{ background: meta.bg, color: meta.color, borderColor: 'transparent' }}>
        {condition || '-'}
      </span>
    );
  };

  const statusBadge = (status) => {
    const meta = STATUS_TO_BADGE[status] || STATUS_TO_BADGE.Decommissioned;
    return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
  };

  const warrantyBadge = (warrantyExpiry) => {
    const meta = getWarrantyState(warrantyExpiry);
    return (
      <span className="badge" style={{ background: meta.bg, color: meta.color, borderColor: 'transparent' }}>
        {meta.label}
      </span>
    );
  };

  const canDelete = role === 'admin';

  return (
    <section className="um-page" aria-label="Asset management">
      <div className="page-header">
        <div>
          <h1 className="um-title">Asset Management</h1>
          <p className="um-subtitle">Track and manage ICT equipment across all departments</p>
        </div>
        {(role === 'admin' || role === 'ict_officer') && (
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            <FiPlus /> Add New Asset
          </button>
        )}
      </div>

      <div className="stats-grid" aria-label="Asset stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#2563eb' }}><FiTool /></div>
          <div>
            <p className="stat-value">{stats.total}</p>
            <p className="stat-label">Total Assets</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#16a34a', background: 'rgba(22,163,74,0.12)' }}><FiTool /></div>
          <div>
            <p className="stat-value">{stats.available}</p>
            <p className="stat-label">Available</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#1d4ed8', background: 'rgba(37,99,235,0.12)' }}><FiTool /></div>
          <div>
            <p className="stat-value">{stats.assigned}</p>
            <p className="stat-label">Assigned</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#e65100', background: 'rgba(229,145,0,0.12)' }}><FiTool /></div>
          <div>
            <p className="stat-value">{stats.underRepair}</p>
            <p className="stat-label">Under Repair</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div
          className="card-body"
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div className="um-search-wrap">
            <FiSearch className="um-search-icon" />
            <input
              className="um-input"
              placeholder="Search by asset tag or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="um-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="um-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="um-select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.length ? departments.map((d) => <option key={d} value={d}>{d}</option>) : null}
          </select>
          <select className="um-select" value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}>
            {conditionOptions.map((o) => (
              <option key={o.value || 'allcond'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : error ? (
        <div className="empty-state">
          <FiAlertTriangle />
          <p>{error}</p>
        </div>
      ) : assets.length === 0 ? (
        emptyState
      ) : (
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Asset</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Department</th>
                <th>Assigned To</th>
                <th>Warranty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, visibleCount).map((a) => {
                const assignedName = a.assignedTo?.name || null;
                const criticalStyle = a.status === 'Under Repair';
                return (
                  <tr
                    key={a._id}
                    className="um-row-hover"
                    style={criticalStyle ? { boxShadow: 'inset 4px 0 0 rgba(229,145,0,0.4)' } : undefined}
                  >
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{a.assetTag}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{a.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                        {(a.brand || a.model) ? `${a.brand || ''}${a.brand && a.model ? ' ' : ''}${a.model || ''}` : '-'}
                      </div>
                    </td>
                    <td>{a.category}</td>
                    <td>{conditionBadge(a.condition)}</td>
                    <td>{statusBadge(a.status)}</td>
                    <td>{a.department || '-'}</td>
                    <td>{assignedName || 'Unassigned'}</td>
                    <td>{warrantyBadge(a.warrantyExpiry)}</td>
                    <td>
                      <div className="um-actions">
                        <Link to={`/assets/${a._id}`} className="btn btn-sm">
                          View
                        </Link>
                        {(role === 'admin' || role === 'ict_officer') && (
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEdit(a)} disabled={loading}>
                            <FiEdit2 /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" className="btn btn-sm um-delete-btn" onClick={() => openDelete(a)} disabled={loading}>
                            <FiTrash2 /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {assets.length > visibleCount && (
            <div className="um-load-more-wrap">
              <button className="btn btn-secondary" type="button" onClick={() => setVisibleCount((v) => v + 20)}>
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {(showCreate || showEdit) && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">{showCreate ? 'Add Asset' : 'Edit Asset'}</h2>
              <button type="button" className="btn btn-sm" onClick={closeModals} disabled={modalSubmitting}>
                <FiX /> Close
              </button>
            </div>
            <div className="card-body">
              {showEdit && (
                <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Status cannot be changed directly. Use Assign or Unassign to update assignment status.
                </div>
              )}

              <form className="um-form-grid" onSubmit={showCreate ? onCreateSubmit : onEditSubmit}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>Basic Information</div>
                  <input
                    className="um-input"
                    placeholder="Asset Name *"
                    value={showCreate ? createForm?.name : editForm?.name}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, name: e.target.value })) : setEditForm((p) => ({ ...p, name: e.target.value })))}
                  />
                  <select
                    className="um-select"
                    value={showCreate ? createForm?.category : editForm?.category}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, category: e.target.value })) : setEditForm((p) => ({ ...p, category: e.target.value })))}
                  >
                    <option value="">Select Category *</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      className="um-input"
                      placeholder="Brand"
                      value={showCreate ? createForm?.brand : editForm?.brand}
                      onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, brand: e.target.value })) : setEditForm((p) => ({ ...p, brand: e.target.value })))}
                    />
                    <input
                      className="um-input"
                      placeholder="Model"
                      value={showCreate ? createForm?.model : editForm?.model}
                      onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, model: e.target.value })) : setEditForm((p) => ({ ...p, model: e.target.value })))}
                    />
                  </div>
                  <input
                    className="um-input"
                    placeholder="Serial Number"
                    value={showCreate ? createForm?.serialNumber : editForm?.serialNumber}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, serialNumber: e.target.value })) : setEditForm((p) => ({ ...p, serialNumber: e.target.value })))}
                  />
                  <select
                    className="um-select"
                    value={showCreate ? createForm?.condition : editForm?.condition}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, condition: e.target.value })) : setEditForm((p) => ({ ...p, condition: e.target.value })))}
                  >
                    {['New', 'Good', 'Fair', 'Poor', 'Faulty'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    className="um-input"
                    placeholder="Location"
                    value={showCreate ? createForm?.location : editForm?.location}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, location: e.target.value })) : setEditForm((p) => ({ ...p, location: e.target.value })))}
                  />
                  <input
                    className="um-input"
                    placeholder="Department"
                    value={showCreate ? createForm?.department : editForm?.department}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, department: e.target.value })) : setEditForm((p) => ({ ...p, department: e.target.value })))}
                  />
                  <textarea
                    className="um-input"
                    rows={3}
                    placeholder="Specifications"
                    value={showCreate ? createForm?.specifications : editForm?.specifications}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, specifications: e.target.value })) : setEditForm((p) => ({ ...p, specifications: e.target.value })))}
                  />
                  <textarea
                    className="um-input"
                    rows={2}
                    placeholder="Notes"
                    value={showCreate ? createForm?.notes : editForm?.notes}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, notes: e.target.value })) : setEditForm((p) => ({ ...p, notes: e.target.value })))}
                  />
                </div>

                <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>Purchase Information</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      className="um-input"
                      type="date"
                      value={showCreate ? createForm?.purchaseDate : editForm?.purchaseDate}
                      onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, purchaseDate: e.target.value })) : setEditForm((p) => ({ ...p, purchaseDate: e.target.value })))}
                    />
                    <input
                      className="um-input"
                      placeholder="Purchase Price (KES)"
                      value={showCreate ? createForm?.purchasePrice : editForm?.purchasePrice}
                      onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, purchasePrice: e.target.value })) : setEditForm((p) => ({ ...p, purchasePrice: e.target.value })))}
                    />
                  </div>
                  <input
                    className="um-input"
                    placeholder="Vendor"
                    value={showCreate ? createForm?.vendor : editForm?.vendor}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, vendor: e.target.value })) : setEditForm((p) => ({ ...p, vendor: e.target.value })))}
                  />
                  <input
                    className="um-input"
                    type="date"
                    value={showCreate ? createForm?.warrantyExpiry : editForm?.warrantyExpiry}
                    onChange={(e) => (showCreate ? setCreateForm((p) => ({ ...p, warrantyExpiry: e.target.value })) : setEditForm((p) => ({ ...p, warrantyExpiry: e.target.value })))}
                  />
                </div>

                {modalError ? <p className="um-form-error">{modalError}</p> : null}

                <div className="um-modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeModals} disabled={modalSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
                    {modalSubmitting ? 'Saving...' : showCreate ? 'Add Asset' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteAssetModal && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Delete Asset</h2>
              <button type="button" className="btn btn-sm" onClick={() => setDeleteAssetModal(false)} disabled={deleteLoading}>
                <FiX /> Close
              </button>
            </div>
            <div className="card-body">
              <p style={{ marginTop: 0 }}>
                Are you sure you want to delete asset{' '}
                <strong>{assets.find((a) => a._id === deleteAssetId)?.assetTag || ''}</strong>? This action cannot be undone.
              </p>
              {deleteError ? <p className="um-form-error">{deleteError}</p> : null}
              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteAssetModal(false)} disabled={deleteLoading}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary um-delete-btn" onClick={onDelete} disabled={deleteLoading}>
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

export default AssetList;