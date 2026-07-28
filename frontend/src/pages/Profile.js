import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/api';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    village: user?.village || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        mobile: user.mobile || '',
        email: user.email || '',
        village: user.village || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authService.updateProfile({
        name: formData.name,
        village: formData.village
      });
      updateProfile(response.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-header-avatar">{initials || '?'}</div>
          <h1>My Profile</h1>
          <p>Update your account information</p>
          {user?.isVerified && (
            <div className="profile-verified-badge">✓ Verified Account</div>
          )}
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>👤 Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>📱 Mobile Number (Read-Only)</label>
            <input
              type="text"
              value={formData.mobile}
              readOnly
            />
            <p className="help-text">Your mobile number cannot be changed.</p>
          </div>

          <div className="form-group">
            <label>✉️ Email Address</label>
            <input
              type="text"
              value={formData.email}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>🏘️ Village / Area</label>
            <input
              type="text"
              name="village"
              value={formData.village}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <div className="profile-footer">
          <Link to="/dashboard">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
