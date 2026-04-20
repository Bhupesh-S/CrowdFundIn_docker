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

  const getAvatarColor = (name) => {
    if (!name) return '#6c757d';
    const colors = ['#667eea', '#764ba2', '#28a745', '#dc3545', '#ffc107', '#17a2b8'];
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-danger';
      case 'campaign_owner':
        return 'badge-primary';
      case 'donor':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
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
      <div className="container mt-4">
        <div className="text-center">
          <h2>Please log in to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="grid grid-2">
        {/* Profile Card */}
        <div className="card">
          <div className="card-body text-center">
            <div 
              className="avatar avatar-lg mx-auto mb-3"
              style={{ backgroundColor: getAvatarColor(user.name) }}
            >
              {getInitials(user.name)}
            </div>
            <h2 className="card-title">{user.name}</h2>
            <p className="text-muted mb-2">{user.email}</p>
            <div className="mb-3">
              <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>
            {user.bio && (
              <p className="text-muted">{user.bio}</p>
            )}
            {user.phone && (
              <p className="text-muted">
                <strong>Phone:</strong> {user.phone}
              </p>
            )}
            <p className="text-muted">
              <small>
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </small>
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
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
          </div>
          <div className="card-body">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
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
                  <small className="text-muted">{formData.bio.length}/500 characters</small>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <div className="spinner" style={{ width: '16px', height: '16px', margin: '0 8px 0 0' }}></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="mb-3">
                  <strong>Name:</strong>
                  <p className="text-muted">{user.name}</p>
                </div>
                <div className="mb-3">
                  <strong>Email:</strong>
                  <p className="text-muted">{user.email}</p>
                </div>
                {user.phone && (
                  <div className="mb-3">
                    <strong>Phone:</strong>
                    <p className="text-muted">{user.phone}</p>
                  </div>
                )}
                <div className="mb-3">
                  <strong>Role:</strong>
                  <p className="text-muted">{getRoleDisplayName(user.role)}</p>
                </div>
                {user.bio && (
                  <div className="mb-3">
                    <strong>Bio:</strong>
                    <p className="text-muted">{user.bio}</p>
                  </div>
                )}
                <div className="mb-3">
                  <strong>Member Since:</strong>
                  <p className="text-muted">
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
    </div>
  );
};

export default Profile;
