import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService.js';
import toast from 'react-hot-toast';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import './AdminPagesProfessional.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 15,
    search: '',
    role: 'all',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [updating, setUpdating] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUsers(filters);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      setError('Failed to fetch users. Please try again.');
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [filters, fetchUsers]);

  const handleUpdateUser = async (userId, updates) => {
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      await adminService.updateUser(userId, updates);
      toast.success('User updated successfully');
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Update user error:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 15,
      search: '',
      role: 'all',
      sortBy: 'createdAt',
      order: 'desc'
    });
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: '#dc3545', label: 'Admin' },
      campaign_owner: { color: '#6f42c1', label: 'Campaign Owner' },
      donor: { color: '#20c997', label: 'Donor' }
    };
    return badges[role] || badges.donor;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <AdminLayoutProfessional>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="retry-btn" onClick={fetchUsers}>
            Try Again
          </button>
        </div>
      </AdminLayoutProfessional>
    );
  }

  return (
    <AdminLayoutProfessional>
      <div className="admin-page">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">User Management</h1>
            <p className="page-description">Manage all registered users and their permissions</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{pagination.totalUsers || 0}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <form onSubmit={handleSearch} className="filters-form">
            <div className="filter-group">
              <label>Search Users</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="donor">Donors</option>
                <option value="campaign_owner">Campaign Owners</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="createdAt">Registration Date</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div className="filter-actions">
              <button type="submit" className="search-btn">
                🔍 Search
              </button>
              <button type="button" onClick={resetFilters} className="reset-btn">
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No users found</h3>
              <p>No users match your current search criteria.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Registration</th>
                      <th>Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const roleBadge = getRoleBadge(user.role);
                      return (
                        <tr key={user._id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                {user.profilePicture ? (
                                  <img src={user.profilePicture} alt={user.name} />
                                ) : (
                                  <span>{user.name?.charAt(0)?.toUpperCase()}</span>
                                )}
                              </div>
                              <div className="user-info">
                                <div className="user-name">{user.name}</div>
                                <div className="user-email">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span 
                              className="role-badge"
                              style={{ backgroundColor: roleBadge.color }}
                            >
                              {roleBadge.label}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${user.isVerified ? 'verified' : 'pending'}`}>
                              {user.isVerified ? '✓ Verified' : '⏳ Pending'}
                            </span>
                          </td>
                          <td>
                            <div className="date-cell">
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td>
                            <div className="activity-cell">
                              <div className="activity-item">
                                <span className="activity-label">Campaigns:</span>
                                <span className="activity-value">{user.createdCampaigns?.length || 0}</span>
                              </div>
                              <div className="activity-item">
                                <span className="activity-label">Donations:</span>
                                <span className="activity-value">{user.donations?.length || 0}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="action-btn edit-btn"
                                disabled={updating[user._id]}
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Previous
                  </button>
                  <div className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                    <span className="total-info">({pagination.totalUsers} total users)</span>
                  </div>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="pagination-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit User Modal */}
        {selectedUser && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit User - {selectedUser.name}</h3>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="user-summary">
                  <div className="summary-avatar">
                    {selectedUser.profilePicture ? (
                      <img src={selectedUser.profilePicture} alt={selectedUser.name} />
                    ) : (
                      <span>{selectedUser.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="summary-info">
                    <h4>{selectedUser.name}</h4>
                    <p>{selectedUser.email}</p>
                    <p>Registered: {formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                <div className="form-section">
                  <h5>Role Management</h5>
                  <div className="role-buttons">
                    {['donor', 'campaign_owner', 'admin'].map(role => (
                      <button
                        key={role}
                        onClick={() => handleUpdateUser(selectedUser._id, { role })}
                        className={`role-btn ${selectedUser.role === role ? 'active' : ''}`}
                        disabled={updating[selectedUser._id]}
                      >
                        {role === 'campaign_owner' ? 'Campaign Owner' : 
                         role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <h5>Verification Status</h5>
                  <div className="verification-buttons">
                    <button
                      onClick={() => handleUpdateUser(selectedUser._id, { isVerified: true })}
                      className={`verify-btn ${selectedUser.isVerified ? 'active' : ''}`}
                      disabled={updating[selectedUser._id]}
                    >
                      ✓ Verify User
                    </button>
                    <button
                      onClick={() => handleUpdateUser(selectedUser._id, { isVerified: false })}
                      className={`unverify-btn ${!selectedUser.isVerified ? 'active' : ''}`}
                      disabled={updating[selectedUser._id]}
                    >
                      ✗ Unverify User
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="cancel-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutProfessional>
  );
};

export default AdminUsers;
