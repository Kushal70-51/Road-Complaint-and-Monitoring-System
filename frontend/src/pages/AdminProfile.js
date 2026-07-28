import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { adminService, resolveImageUrl } from '../services/api';
import { validateFileSize, validateFileType } from '../utils/validators';
import { formatDate, formatDateTime } from '../utils/formatDate';
import './adminDashboard.css';

const AdminProfile = () => {
  const { user: admin, updateProfile, logout: doLogout } = useContext(AuthContext);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [profileForm, setProfileForm] = useState({ name: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    doLogout();
    // on logout go to public home page
    navigate('/', { replace: true });
  };

  // prevent browser back-navigation from leaving admin pages while logged-in
  useEffect(() => {
    if (!(admin && admin.role)) return;
    // push current state so back will stay
    try { window.history.pushState(null, '', location.pathname); } catch (e) {}
    const onPop = () => {
      try { window.history.pushState(null, '', location.pathname); } catch (e) {}
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [admin, location.pathname]);

  const fetchAdmins = async () => {
    try {
      const data = await adminService.getAdmins();
      setAdmins(data.admins || []);
    } catch (err) {
      console.error('fetch admins', err);
      setError('Failed to fetch admin users');
    }
  };

  const openPasswordModal = () => {
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('');
    setError('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('');
    setError('');
  };

  const openAdminModal = () => {
    setAdminForm({ username: '', password: '', confirmPassword: '' });
    setMessage('');
    setError('');
    fetchAdmins();
    setShowAdminModal(true);
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAdminForm({ username: '', password: '', confirmPassword: '' });
    setMessage('');
    setError('');
  };

  const openEditProfileModal = () => {
    setProfileForm({ name: admin?.name || '' });
    setAvatarFile(null);
    setAvatarPreview(resolveImageUrl(admin?.avatarUrl));
    setAvatarError('');
    setMessage('');
    setError('');
    setShowEditProfileModal(true);
  };

  const closeEditProfileModal = () => {
    setShowEditProfileModal(false);
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarError('');
    setMessage('');
    setError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFileSize(file, 2)) {
      setAvatarError('Photo must be 2MB or smaller');
      return;
    }

    if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'])) {
      setAvatarError('Only JPG, PNG, GIF or WEBP images are allowed');
      return;
    }

    setAvatarError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handleAdminFormChange = e => {
    const { name, value } = e.target;
    setAdminForm({ ...adminForm, [name]: value });
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      await adminService.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setMessage('Password changed successfully!');
      setTimeout(() => {
        closePasswordModal();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
  };

  const submitCreateAdmin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!adminForm.username || !adminForm.password || !adminForm.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (adminForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await adminService.createAdmin({ username: adminForm.username, password: adminForm.password });
      setMessage('Admin user created successfully!');
      setAdminForm({ username: '', password: '', confirmPassword: '' });
      fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to create admin');
    }
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin user?')) return;

    try {
      await adminService.deleteAdmin(adminId);
      setMessage('Admin user deleted successfully!');
      fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to delete admin');
    }
  };

  const submitProfileEdit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSavingProfile(true);

    try {
      const data = new FormData();
      data.append('name', profileForm.name.trim());
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const response = await adminService.updateProfile(data);
      if (response.admin) {
        updateProfile(response.admin);
      }
      setMessage('Profile updated successfully!');
      setTimeout(() => closeEditProfileModal(), 1200);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getProfile();
        if (data.admin) {
          updateProfile(data.admin);
        }
      } catch (err) {
        console.error('could not refresh admin profile', err);
      }
    };
    load();
  }, [updateProfile]);

  const isSuperAdmin = admin?.role === 'superadmin';
  const avatarUrl = resolveImageUrl(admin?.avatarUrl);
  const displayName = admin?.name || admin?.username || 'Admin';

  return (
    <div className="admin-dashboard">
      {/* Profile header */}
      <div className="admin-profile-card">
        <button type="button" className="profile-avatar profile-avatar-button" onClick={openEditProfileModal} title="Edit profile photo">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="profile-avatar-img" />
          ) : (
            <i className="profile-icon">👤</i>
          )}
          <span className="profile-avatar-edit-badge">✏️</span>
        </button>
        <div className="profile-info">
          <h2>Welcome, <span className="admin-name">{displayName}</span></h2>
          {admin?.name && <p className="profile-subtitle">@{admin.username}</p>}
          <p className="profile-role">Role: <span className="role-text">{admin?.role || 'admin'}</span></p>
          <div className="profile-meta">
            {admin?.createdAt && <span>🗓️ Member since {formatDate(admin.createdAt)}</span>}
            {admin?.lastLoginAt && <span>🕒 Last login {formatDateTime(admin.lastLoginAt)}</span>}
          </div>
        </div>
        <button className="btn btn-logout" onClick={logout}>Logout</button>
      </div>

      <div className="table-card admin-quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={openEditProfileModal}>🖼️ Edit Profile</button>
          <button className="btn btn-secondary" onClick={openPasswordModal}>🔑 Change Admin Password</button>
          {isSuperAdmin && (
            <button className="btn btn-secondary" onClick={openAdminModal}>👥 Manage Admin Users</button>
          )}
          <Link to="/admin" className="btn btn-primary">📋 Go to Complaint Dashboard</Link>
        </div>
        {!isSuperAdmin && (
          <p className="admin-quick-actions-hint">Managing admin users requires superadmin privileges.</p>
        )}
      </div>

      {/* Edit Profile modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={closeEditProfileModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={closeEditProfileModal}>×</button>
            </div>
            <form onSubmit={submitProfileEdit} className="modal-form">
              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}

              <div className="avatar-upload-row">
                <div className="avatar-upload-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" />
                  ) : (
                    <i className="profile-icon">👤</i>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <p className="help-text">JPG, PNG, GIF or WEBP. Max 2MB.</p>
                  {avatarError && <span className="error">{avatarError}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ name: e.target.value })}
                  placeholder="e.g., Priya Sharma"
                  maxLength={60}
                />
                <p className="help-text">Shown instead of your username across the admin panel. Your login username (@{admin?.username}) stays the same.</p>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeEditProfileModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Admin Password</h2>
              <button className="modal-close" onClick={closePasswordModal}>×</button>
            </div>
            <form onSubmit={submitPasswordChange} className="modal-form">
              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Change Password</button>
                <button type="button" className="btn btn-secondary" onClick={closePasswordModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Admin Users Modal */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={closeAdminModal}>
          <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Admin Users</h2>
              <button className="modal-close" onClick={closeAdminModal}>×</button>
            </div>
            <div className="modal-content">
              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}

              <div className="create-admin-section">
                <h3>Create New Admin User</h3>
                <form onSubmit={submitCreateAdmin} className="create-admin-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        name="username"
                        value={adminForm.username}
                        onChange={handleAdminFormChange}
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        name="password"
                        value={adminForm.password}
                        onChange={handleAdminFormChange}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={adminForm.confirmPassword}
                        onChange={handleAdminFormChange}
                        placeholder="Confirm password"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-create">Create Admin</button>
                  </div>
                </form>
              </div>

              <div className="admins-list-section">
                <h3>Current Admin Users</h3>
                {admins.length === 0 ? (
                  <p className="no-data">No admin users found</p>
                ) : (
                  <table className="admins-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map(a => (
                        <tr key={a._id}>
                          <td>{a.name ? `${a.name} (@${a.username})` : a.username}</td>
                          <td><span className="role-badge">{a.role}</span></td>
                          <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                          <td>
                            {admins.length > 1 && (
                              <button
                                onClick={() => deleteAdmin(a._id)}
                                className="btn btn-small btn-danger"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeAdminModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
