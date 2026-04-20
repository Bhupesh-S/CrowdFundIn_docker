import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import toast from 'react-hot-toast';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import './AdminPagesProfessional.css';

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [updating, setUpdating] = useState({});
  const navigate = useNavigate();

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getCampaigns(filters);
      setCampaigns(data.campaigns);
      setPagination(data.pagination);
    } catch (error) {
      setError('Failed to fetch campaigns. Please try again.');
      console.error('Fetch campaigns error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCampaigns();
  }, [filters, fetchCampaigns]);

  const handleUpdateCampaignStatus = async (campaignId, status) => {
    try {
      setUpdating(prev => ({ ...prev, [campaignId]: true }));
      await adminService.updateCampaignStatus(campaignId, status);
      toast.success('Campaign status updated successfully');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to update campaign status');
      console.error('Update campaign status error:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      search: '',
      status: 'all',
      sortBy: 'createdAt',
      order: 'desc'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#ffc107', label: 'Pending' },
      active: { color: '#28a745', label: 'Active' },
      completed: { color: '#007bff', label: 'Completed' },
      cancelled: { color: '#6c757d', label: 'Cancelled' },
      expired: { color: '#dc3545', label: 'Expired' },
      rejected: { color: '#dc3545', label: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  const getProgressPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  if (error) {
    return (
      <AdminLayoutProfessional>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="retry-btn" onClick={fetchCampaigns}>
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
            <h1 className="page-title">Campaign Management</h1>
            <p className="page-description">Monitor and manage all fundraising campaigns</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{pagination.totalCampaigns || 0}</span>
              <span className="stat-label">Total Campaigns</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <form onSubmit={handleSearch} className="filters-form">
            <div className="filter-group">
              <label>Search Campaigns</label>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="createdAt">Creation Date</option>
                <option value="goalAmount">Goal Amount</option>
                <option value="currentAmount">Current Amount</option>
                <option value="deadline">Deadline</option>
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

        {/* Campaigns Grid */}
        <div className="content-card">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>No campaigns found</h3>
              <p>No campaigns match your current search criteria.</p>
            </div>
          ) : (
            <>
              <div className="campaigns-grid">
                {campaigns.map(campaign => {
                  const statusBadge = getStatusBadge(campaign.status);
                  const progressPercentage = getProgressPercentage(campaign.currentAmount, campaign.goalAmount);
                  
                  return (
                    <div key={campaign._id} className="campaign-card">
                      <div className="campaign-image">
                        {campaign.image ? (
                          <img src={campaign.image} alt={campaign.title} />
                        ) : (
                          <div className="image-placeholder">
                            <span>🎯</span>
                          </div>
                        )}
                        <div className="campaign-status-overlay">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: statusBadge.color }}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>

                      <div className="campaign-content">
                        <div className="campaign-header">
                          <h3 className="campaign-title">{campaign.title}</h3>
                          <span className="campaign-category">{campaign.category}</span>
                        </div>

                        <p className="campaign-description">
                          {campaign.description.length > 120 
                            ? `${campaign.description.substring(0, 120)}...`
                            : campaign.description
                          }
                        </p>

                        <div className="campaign-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <div className="progress-info">
                            <span className="raised-amount">
                              {formatCurrency(campaign.currentAmount)}
                            </span>
                            <span className="goal-amount">
                              of {formatCurrency(campaign.goalAmount)}
                            </span>
                          </div>
                          <div className="progress-percentage">
                            {progressPercentage.toFixed(1)}% funded
                          </div>
                        </div>

                        <div className="campaign-meta">
                          <div className="meta-item">
                            <span className="meta-label">Owner:</span>
                            <span className="meta-value">{campaign.owner?.name || 'Unknown'}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Created:</span>
                            <span className="meta-value">{formatDate(campaign.createdAt)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Deadline:</span>
                            <span className="meta-value">{formatDate(campaign.deadline)}</span>
                          </div>
                        </div>

                        <div className="campaign-actions">
                          <button
                            onClick={() => navigate(`/campaigns/${campaign._id}`)}
                            className="action-btn view-btn"
                          >
                            👁 View
                          </button>
                          
                          <div className="status-actions">
                            <select
                              onChange={(e) => handleUpdateCampaignStatus(campaign._id, e.target.value)}
                              disabled={updating[campaign._id]}
                              className="status-select"
                              defaultValue=""
                            >
                              <option value="">Change Status</option>
                              {['active', 'completed', 'cancelled', 'expired'].map(status => (
                                <option 
                                  key={status} 
                                  value={status}
                                  disabled={campaign.status === status}
                                >
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    <span className="total-info">({pagination.totalCampaigns} total campaigns)</span>
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
      </div>
    </AdminLayoutProfessional>
  );
};

export default AdminCampaigns;
