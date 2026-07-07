import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiRefreshCw, FiShield, FiUser } from 'react-icons/fi';
import API from '../../api/axios';
import { logout, setUser } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { queryKeys } from '../../lib/queryClient';
import { formatRole } from '../../utils/roles';
import PageLoader from '../../components/ui/PageLoader';
import './AccountSettings.css';

const defaultPreferences = {
  emailNotifications: true,
  ticketAssignmentNotifications: true,
  ticketUpdates: true,
  maintenanceAnnouncements: true,
  systemNotifications: true,
};

const defaultProfile = {
  name: '',
  email: '',
  phone: '',
  department: '',
  jobTitle: '',
  staffId: '',
  username: '',
  role: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  lastLogin: '',
  profileImage: '',
  activeSession: null,
  themePreference: 'system',
  notificationPreferences: defaultPreferences,
  appearancePreferences: { theme: 'system' },
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'N/A';
  return dt.toLocaleString();
};

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { label: 'Weak', color: '#dc2626' };
  if (score <= 4) return { label: 'Medium', color: '#d97706' };
  return { label: 'Strong', color: '#16a34a' };
};

const AccountSettings = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { themePreference, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);
  const [profileForm, setProfileForm] = useState(defaultProfile);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [theme, setThemeState] = useState('system');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const {
    data: fetchedProfile,
    isLoading: loading,
    isError,
    error,
    refetch: loadProfile,
  } = useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: async () => {
      const { data } = await API.get('/users/me');
      return data?.data || defaultProfile;
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!fetchedProfile) return;
    setProfile(fetchedProfile);
    setProfileForm({
      ...defaultProfile,
      ...fetchedProfile,
    });
    setPreferences({
      ...defaultPreferences,
      ...(fetchedProfile.notificationPreferences || {}),
    });
    const savedTheme = fetchedProfile.themePreference || fetchedProfile.appearancePreferences?.theme || 'system';
    setThemeState(savedTheme);
    setTheme(savedTheme);
  }, [fetchedProfile, setTheme]);

  useEffect(() => {
    if (!isError) return;
    toast.error(error?.response?.data?.message || 'Unable to load account settings.');
  }, [isError, error]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordForm.newPassword || ''),
    [passwordForm.newPassword]
  );

  const displayRole = formatRole(profileForm.role || user?.role);

  const syncAuthUser = (updated) => {
    const merged = {
      ...(user || {}),
      name: updated?.name || user?.name || '',
      email: updated?.email || user?.email || '',
      phone: updated?.phone || user?.phone || '',
      department: updated?.department || user?.department || '',
      role: updated?.role || user?.role || '',
      profileImage: updated?.profileImage || user?.profileImage || '',
      username: updated?.username || user?.username || '',
      staffId: updated?.staffId || user?.staffId || '',
      jobTitle: updated?.jobTitle || user?.jobTitle || '',
      themePreference: updated?.themePreference || user?.themePreference || themePreference || 'system',
      token: user?.token,
    };
    dispatch(setUser(merged));
  };

  const onSaveChanges = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileForm.name.trim()) return toast.error('Full name is required.');
    if (!emailRegex.test(profileForm.email)) return toast.error('Please provide a valid email address.');

    setSaving(true);
    try {
      const profileRes = await API.put('/users/me', {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        department: profileForm.department.trim(),
        jobTitle: profileForm.jobTitle.trim(),
        username: profileForm.username.trim(),
      });
      const preferenceRes = await API.put('/users/preferences', {
        notificationPreferences: preferences,
        appearancePreferences: { theme },
        themePreference: theme,
      });
      const nextProfile = preferenceRes?.data?.data || profileRes?.data?.data || profile;
      setProfile(nextProfile);
      setProfileForm((prev) => ({ ...prev, ...nextProfile }));
      syncAuthUser(nextProfile);
      queryClient.setQueryData(queryKeys.userProfile, nextProfile);
      toast.success('Account settings updated successfully.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update account settings.');
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setProfileForm({
      ...defaultProfile,
      ...profile,
    });
    setPreferences({
      ...defaultPreferences,
      ...(profile.notificationPreferences || {}),
    });
    const savedTheme = profile.themePreference || profile.appearancePreferences?.theme || themePreference || 'system';
    setThemeState(savedTheme);
    setTheme(savedTheme);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error('Please complete all password fields.');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Confirm password does not match new password.');
    }
    if (getPasswordStrength(passwordForm.newPassword).label === 'Weak') {
      return toast.error('Please choose a stronger password.');
    }

    setPasswordLoading(true);
    try {
      await API.put('/users/change-password', passwordForm);
      toast.success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const onUploadProfileImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);
    setUploadingImage(true);
    try {
      const { data } = await API.post('/users/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const nextProfile = data?.data || profile;
      setProfile(nextProfile);
      setProfileForm((prev) => ({ ...prev, profileImage: nextProfile.profileImage || '' }));
      syncAuthUser(nextProfile);
      queryClient.setQueryData(queryKeys.userProfile, nextProfile);
      toast.success('Profile image updated.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload profile image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const onLogoutAllDevices = async () => {
    setLogoutAllLoading(true);
    try {
      const { data } = await API.post('/users/logout-all-sessions');
      dispatch(logout());
      toast.success(data?.message || 'All devices logged out.');
      window.location.href = '/login';
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to logout all devices.');
    } finally {
      setLogoutAllLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="um-page" aria-label="Manage account settings">
        <PageLoader label="Loading account settings..." />
      </div>
    );
  }

  return (
    <section className="um-page" aria-label="Manage account settings">
      <header className="page-header">
        <div>
          <h1 className="um-title">Manage Account Settings</h1>
          <p className="um-subtitle">Update your profile, security settings, preferences, and appearance.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadProfile}>
          <FiRefreshCw /> Reload
        </button>
      </header>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <article className="stat-card">
          <span className="stat-icon"><FiUser /></span>
          <span>
            <p className="stat-value" style={{ fontSize: '1rem' }}>{displayRole}</p>
            <p className="stat-label">Role</p>
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><FiShield /></span>
          <span>
            <p className="stat-value" style={{ fontSize: '1rem' }}>
              {profileForm.isActive ? 'Active' : 'Inactive'}
            </p>
            <p className="stat-label">Account Status</p>
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><FiShield /></span>
          <span>
            <p className="stat-value" style={{ fontSize: '1rem' }}>{formatDateTime(profileForm.lastLogin)}</p>
            <p className="stat-label">Last Login</p>
          </span>
        </article>
      </div>

      <article className="card">
        <div className="card-header">
          <h3 className="card-title">Profile Information</h3>
        </div>
        <div className="card-body">
          <div className="account-profile-top">
            <div className="account-avatar">
              {profileForm.profileImage ? (
                <img src={profileForm.profileImage} alt="Profile" loading="lazy" decoding="async" />
              ) : (
                <span>{profileForm.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <div>
              <label className="btn btn-secondary" htmlFor="profileImageInput">
                {uploadingImage ? 'Uploading...' : 'Upload Profile Picture'}
              </label>
              <input
                id="profileImageInput"
                type="file"
                accept="image/*"
                className="account-hidden-input"
                onChange={onUploadProfileImage}
                disabled={uploadingImage}
              />
            </div>
          </div>

          <div className="account-grid">
            <div>
              <label className="stat-label">Full Name</label>
              <input
                className="um-input"
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="stat-label">Email</label>
              <input
                className="um-input"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="stat-label">Phone Number</label>
              <input
                className="um-input"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="stat-label">Department</label>
              <input
                className="um-input"
                value={profileForm.department}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div>
              <label className="stat-label">Job Title</label>
              <input
                className="um-input"
                value={profileForm.jobTitle}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
              />
            </div>
            <div>
              <label className="stat-label">Username</label>
              <input
                className="um-input"
                value={profileForm.username}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <label className="stat-label">Staff ID (Read-only)</label>
              <input className="um-input" value={profileForm.staffId || 'Not assigned'} readOnly />
            </div>
          </div>
        </div>
      </article>

      <article className="card">
        <div className="card-header">
          <h3 className="card-title">Change Password</h3>
        </div>
        <div className="card-body">
          <form className="account-grid" onSubmit={onChangePassword}>
            {[
              ['currentPassword', 'Current Password', 'current'],
              ['newPassword', 'New Password', 'next'],
              ['confirmPassword', 'Confirm Password', 'confirm'],
            ].map(([field, label, key]) => (
              <div key={field}>
                <label className="stat-label">{label}</label>
                <div className="account-password-wrap">
                  <input
                    className="um-input"
                    type={showPassword[key] ? 'text' : 'password'}
                    value={passwordForm[field]}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }))}
                  >
                    {showPassword[key] ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {field === 'newPassword' && passwordForm.newPassword && (
                  <p className="muted" style={{ marginTop: 8 }}>
                    Strength: <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong>
                  </p>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </article>

      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <article className="card">
          <div className="card-header">
            <h3 className="card-title">Security</h3>
          </div>
          <div className="card-body account-grid">
            <p className="muted">Last login: {formatDateTime(profile.lastLogin)}</p>
            <p className="muted">
              Active session: {profile?.activeSession?.ipAddress || 'Unknown'} - {profile?.activeSession?.userAgent || 'Unknown device'}
            </p>
            <p className="muted">Two-factor authentication: Not configured yet.</p>
            <button type="button" className="btn btn-secondary" onClick={onLogoutAllDevices} disabled={logoutAllLoading}>
              {logoutAllLoading ? 'Logging out all devices...' : 'Logout from all devices'}
            </button>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <h3 className="card-title">Appearance</h3>
          </div>
          <div className="card-body account-grid">
            <div>
              <label className="stat-label">Theme</label>
              <div className="theme-radio-group" role="radiogroup" aria-label="Theme preference">
                {[
                  ['light', 'Light Mode'],
                  ['dark', 'Dark Mode'],
                  ['system', 'System Default'],
                ].map(([value, label]) => (
                  <label key={value} className="theme-radio-item">
                    <input
                      type="radio"
                      name="themePreference"
                      value={value}
                      checked={theme === value}
                      onChange={() => {
                        setThemeState(value);
                        setTheme(value);
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className="card">
        <div className="card-header">
          <h3 className="card-title">Notification Preferences</h3>
        </div>
        <div className="card-body account-grid">
          {[
            ['emailNotifications', 'Email notifications'],
            ['ticketAssignmentNotifications', 'Ticket assignment notifications'],
            ['ticketUpdates', 'Ticket updates'],
            ['maintenanceAnnouncements', 'Maintenance announcements'],
            ['systemNotifications', 'System notifications'],
          ].map(([key, label]) => (
            <label key={key} className="um-checkbox-row">
              <input
                type="checkbox"
                checked={Boolean(preferences[key])}
                onChange={(e) => setPreferences((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
      </article>

      <article className="card">
        <div className="card-header">
          <h3 className="card-title">Account Information (Read-only)</h3>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table>
              <tbody>
                <tr><td>Username</td><td>{profileForm.username || 'N/A'}</td></tr>
                <tr><td>Role</td><td>{displayRole}</td></tr>
                <tr><td>Account Status</td><td>{profileForm.isActive ? 'Active' : 'Inactive'}</td></tr>
                <tr><td>Date Created</td><td>{formatDateTime(profileForm.createdAt)}</td></tr>
                <tr><td>Last Updated</td><td>{formatDateTime(profileForm.updatedAt)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={onSaveChanges} disabled={saving}>
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </section>
  );
};

export default AccountSettings;
