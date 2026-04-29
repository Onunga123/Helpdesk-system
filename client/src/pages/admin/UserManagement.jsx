import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiEdit2,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../api/axios';

const initialCreateForm = {
  name: '',
  email: '',
  role: 'student',
  department: '',
  phone: '',
  password: '',
};

const initialEditForm = {
  name: '',
  email: '',
  role: 'student',
  department: '',
  phone: '',
  isActive: true,
  password: '',
};

const roleClassMap = {
  admin: 'badge-admin',
  ict_officer: 'badge-ict',
  staff: 'badge-staff',
  student: 'badge-student',
};

const roleLabelMap = {
  admin: 'Admin',
  ict_officer: 'ICT Officer',
  staff: 'Staff',
  student: 'Student',
};

const statusClass = (isActive) => (isActive ? 'badge-resolved' : 'badge-closed');

const UserManagement = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tableError, setTableError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);

  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState('');

  const fetchUsers = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setTableError('');
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.isActive = statusFilter;
      const { data } = await API.get('/users', { params });
      setUsers(data?.data || []);
    } catch (error) {
      setTableError(error?.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/users/stats');
      setStats(data?.data || null);
    } catch {
      setStats(null);
    }
  };

  const refreshAll = async ({ silent = false } = {}) => {
    await Promise.all([fetchUsers({ silent }), fetchStats()]);
  };

  useEffect(() => {
    refreshAll();
  }, [roleFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u?.name?.toLowerCase().includes(term) ||
        u?.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasMore = filteredUsers.length > visibleCount;

  const totalUsers = stats?.total ?? users.length;
  const activeUsers =
    stats?.byStatus?.find((entry) => entry.status === 'Active')?.count ??
    users.filter((u) => u.isActive).length;
  const inactiveUsers =
    stats?.byStatus?.find((entry) => entry.status === 'Inactive')?.count ??
    users.filter((u) => !u.isActive).length;
  const ictOfficers =
    stats?.byRole?.find((entry) => entry._id === 'ict_officer')?.count ??
    users.filter((u) => u.role === 'ict_officer').length;

  const closeCreateModal = () => {
    setShowCreate(false);
    setCreateForm(initialCreateForm);
    setCreateError('');
  };

  const closeEditModal = () => {
    setShowEdit(false);
    setSelectedUser(null);
    setEditError('');
  };

  const closeDeleteModal = () => {
    setShowDelete(false);
    setSelectedUser(null);
    setDeleteError('');
  };

  const openEditModal = (targetUser) => {
    setSelectedUser(targetUser);
    setEditForm({
      name: targetUser.name || '',
      email: targetUser.email || '',
      role: targetUser.role || 'student',
      department: targetUser.department || '',
      phone: targetUser.phone || '',
      isActive: !!targetUser.isActive,
      password: '',
    });
    setEditError('');
    setShowEdit(true);
  };

  const onCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError('Full name, email and password are required.');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }
    setCreateLoading(true);
    try {
      await API.post('/users', createForm);
      toast.success('User created successfully');
      closeCreateModal();
      await refreshAll({ silent: true });
    } catch (error) {
      setCreateError(error?.response?.data?.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser?._id) return;
    setEditError('');
    setEditLoading(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        department: editForm.department,
        phone: editForm.phone,
        isActive: editForm.isActive,
      };
      if (editForm.password.trim()) payload.password = editForm.password.trim();
      await API.put(`/users/${selectedUser._id}`, payload);
      toast.success('User updated successfully');
      closeEditModal();
      await refreshAll({ silent: true });
    } catch (error) {
      setEditError(error?.response?.data?.message || 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  const onToggleActive = async (targetUser) => {
    setToggleLoadingId(targetUser._id);
    try {
      await API.put(`/users/${targetUser._id}`, {
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department || '',
        phone: targetUser.phone || '',
        isActive: !targetUser.isActive,
      });
      toast.success(`User ${targetUser.isActive ? 'deactivated' : 'activated'} successfully`);
      await refreshAll({ silent: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to change user status');
    } finally {
      setToggleLoadingId('');
    }
  };

  const onDeleteUser = async () => {
    if (!selectedUser?._id) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await API.delete(`/users/${selectedUser._id}`);
      toast.success('User deleted successfully');
      closeDeleteModal();
      await refreshAll({ silent: true });
    } catch (error) {
      setDeleteError(error?.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <section className="um-page">
      <div className="page-header">
        <div>
          <h1 className="um-title">User Management</h1>
          <p className="um-subtitle">Manage system users, roles and access</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <FiPlus /> Add New User
        </button>
      </div>

      <div className="stats-grid um-stats">
        <div className="stat-card"><div className="stat-icon"><FiUsers /></div><div><p className="stat-value">{totalUsers}</p><p className="stat-label">Total Users</p></div></div>
        <div className="stat-card"><div className="stat-icon"><FiShield /></div><div><p className="stat-value">{activeUsers}</p><p className="stat-label">Active Users</p></div></div>
        <div className="stat-card"><div className="stat-icon"><FiAlertTriangle /></div><div><p className="stat-value">{inactiveUsers}</p><p className="stat-label">Inactive Users</p></div></div>
        <div className="stat-card"><div className="stat-icon"><FiUser /></div><div><p className="stat-value">{ictOfficers}</p><p className="stat-label">ICT Officers</p></div></div>
      </div>

      <div className="card">
        <div className="card-body um-filter-grid">
          <div className="um-search-wrap">
            <FiSearch className="um-search-icon" />
            <input
              className="um-input"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(10);
              }}
            />
          </div>

          <select className="um-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="ict_officer">ICT Officer</option>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>

          <select className="um-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button className="btn btn-secondary" onClick={() => refreshAll({ silent: true })} disabled={refreshing}>
            <FiRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Users</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : tableError ? (
            <div className="empty-state">
              <FiAlertTriangle />
              <p>{tableError}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <FiUsers />
              <p>No users found for current filters.</p>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((u) => {
                      const initials = (u?.name || 'U')
                        .split(' ')
                        .slice(0, 2)
                        .map((chunk) => chunk[0]?.toUpperCase())
                        .join('');

                      return (
                        <tr key={u._id} className="um-row-hover">
                          <td>
                            <div className="um-user-cell">
                              <div className="um-avatar">{initials}</div>
                              <div>
                                <div className="um-user-name">{u.name}</div>
                                <div className="um-user-email"><FiMail /> {u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className={`badge ${roleClassMap[u.role] || 'badge-student'}`}>{roleLabelMap[u.role] || u.role}</span></td>
                          <td>{u.department || '-'}</td>
                          <td><span className={`badge ${statusClass(u.isActive)}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                          <td>
                            <div className="um-actions">
                              <button className="btn btn-sm" onClick={() => openEditModal(u)}><FiEdit2 /> Edit</button>
                              <button
                                className="btn btn-sm"
                                onClick={() => onToggleActive(u)}
                                disabled={toggleLoadingId === u._id}
                              >
                                {toggleLoadingId === u._id ? 'Saving...' : u.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                className="btn btn-sm um-delete-btn"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setDeleteError('');
                                  setShowDelete(true);
                                }}
                              >
                                <FiTrash2 /> Delete
                              </button>
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
                  <button className="btn btn-secondary" onClick={() => setVisibleCount((prev) => prev + 10)}>
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Add New User</h2>
              <button className="btn btn-sm" onClick={closeCreateModal}><FiX /></button>
            </div>
            <form className="card-body um-form-grid" onSubmit={onCreateUser}>
              <input className="um-input" placeholder="Full Name *" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="um-input" placeholder="Email Address *" type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
              <select className="um-select" value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="admin">Admin</option>
                <option value="ict_officer">ICT Officer</option>
                <option value="staff">Staff</option>
                <option value="student">Student</option>
              </select>
              <input className="um-input" placeholder="Department" value={createForm.department} onChange={(e) => setCreateForm((p) => ({ ...p, department: e.target.value }))} />
              <input className="um-input" placeholder="Phone Number" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
              <input className="um-input" placeholder="Password *" type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />

              {createError && <p className="um-form-error">{createError}</p>}

              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCreateModal} disabled={createLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>{createLoading ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Edit User</h2>
              <button className="btn btn-sm" onClick={closeEditModal}><FiX /></button>
            </div>
            <form className="card-body um-form-grid" onSubmit={onSaveEdit}>
              <input className="um-input" placeholder="Full Name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="um-input" placeholder="Email Address" type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
              <select className="um-select" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="admin">Admin</option>
                <option value="ict_officer">ICT Officer</option>
                <option value="staff">Staff</option>
                <option value="student">Student</option>
              </select>
              <input className="um-input" placeholder="Department" value={editForm.department} onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))} />
              <input className="um-input" placeholder="Phone Number" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
              <input className="um-input" placeholder="Password (optional)" type="password" value={editForm.password} onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))} />

              <label className="um-checkbox-row">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                <span>{editForm.isActive ? 'Activate account' : 'Deactivate account'}</span>
              </label>

              {editError && <p className="um-form-error">{editError}</p>}

              <div className="um-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeEditModal} disabled={editLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="um-modal-overlay" role="dialog" aria-modal="true">
          <div className="card um-modal-card">
            <div className="card-header">
              <h2 className="card-title">Delete User</h2>
              <button className="btn btn-sm" onClick={closeDeleteModal}><FiX /></button>
            </div>
            <div className="card-body">
              <p>
                Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
              </p>
              {deleteError && <p className="um-form-error">{deleteError}</p>}
              <div className="um-modal-actions">
                <button className="btn btn-secondary" onClick={closeDeleteModal} disabled={deleteLoading}>Cancel</button>
                <button className="btn btn-primary um-delete-btn" onClick={onDeleteUser} disabled={deleteLoading}>
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

export default UserManagement;
