import React, { useState } from 'react';
import './Profile.css';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'campaign_owner':
        return 'Campaign Owner';
      case 'donor':
        return 'Donor';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  if (!user) {
    return (
      <div className="container mt-4 fade-up-mount">
        <div className="text-center fade-up-stagger-0" style={{ animation: 'fadeUp 500ms cubic-bezier(0.4, 0, 0.2, 1) both' }}>
          <h2 style={{ color: 'var(--text-primary)' }}>Please log in to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 fade-up-mount" style={{ paddingBottom: '40px' }}>
      <div className="card profile-card-unified mx-auto fade-up-stagger-0" style={{ maxWidth: '640px', animation: 'fadeUp 500ms cubic-bezier(0.4, 0, 0.2, 1) both' }}>
        <div className="profile-gradient-band"></div>
        <div className="card-body" style={{ padding: '2rem' }}>
          <div className="text-center mb-4">
            <div className="avatar avatar-lg mx-auto mb-3" style={{ background: 'var(--primary)', color: 'white', fontSize: '24px' }}>
              {getInitials(user.name)}
            </div>
            <h2 className="card-title" style={{ fontSize: '1.75rem' }}>{user.name}</h2>
            <p className="text-muted mb-2">{user.email}</p>
            <div>
              <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="card-title mb-0">Profile Information</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-outline btn-small"
              >
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Bio (Optional)</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="4"
                  placeholder="Tell us a bit about yourself..."
                  maxLength="500"
                />
                <div className="text-right mt-1">
                  <small className="text-muted">{formData.bio.length}/500 characters</small>
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', margin: '0 8px 0 0', borderWidth: '2px' }}></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info-grid">
              <div className="mb-4">
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Phone</strong>
                <p className="text-secondary m-0">{user.phone || 'Not provided'}</p>
              </div>
              <div className="mb-4">
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Bio</strong>
                <p className="text-secondary m-0">{user.bio || 'No bio provided.'}</p>
              </div>
              <div className="mb-4">
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Member Since</strong>
                <p className="text-secondary m-0">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
