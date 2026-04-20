import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDonorHistory = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    donor: '',
    campaign: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const navigate = useNavigate();

  const fetchDonorHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getDonorHistory(filters);
      setDonations(data.donations);
      setPagination(data.pagination);
      setTotalAmount(data.totalAmount);
    } catch (error) {
      toast.error('Failed to fetch donor history');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDonorHistory();
  }, [filters, fetchDonorHistory]);

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      donor: '',
      campaign: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      order: 'desc'
    });
  };

  if (loading) {
    return (
      <AdminLayoutProfessional>
        <div className="admin-dashboard-page">
          <div className="container">
            <div className="admin-loading">
              <div className="loading-spinner"></div>
              <p>Loading donor history...</p>
            </div>
          </div>
        </div>
      </AdminLayoutProfessional>
    );
  }

  return (
    <AdminLayoutProfessional>
      <div className="admin-dashboard-page">
        <div className="container">
          <div className="admin-header">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="back-btn"
            >
              ← Back to Dashboard
            </button>
            <h1 className="admin-title">Donor History</h1>
            <p className="admin-subtitle">Complete donation records and analytics</p>
          </div>

        {/* Summary Stats */}
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{pagination.total || 0}</div>
              <div className="stat-label">Total Donations</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{formatCurrency(totalAmount)}</div>
              <div className="stat-label">Total Amount</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-number">
                {pagination.total > 0 ? formatCurrency(totalAmount / pagination.total) : '$0'}
              </div>
              <div className="stat-label">Average Donation</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Date From:</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Date To:</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Sort By:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="createdAt">Date</option>
                <option value="amount">Amount</option>
                <option value="donor">Donor</option>
                <option value="campaign">Campaign</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Order:</label>
              <select
                value={filters.order}
                onChange={(e) => setFilters(prev => ({ ...prev, order: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>

        {donations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No donations found</h3>
            <p>No donations match the current filters.</p>
          </div>
        ) : (
          <>
            <div className="donations-table-container">
              <table className="donations-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Donor</th>
                    <th>Campaign</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map(donation => (
                    <tr key={donation._id}>
                      <td>
                        <div className="date-cell">
                          <span className="date">{formatDate(donation.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="donor-cell">
                          <div className="donor-info">
                            <span className="donor-name">
                              {donation.isAnonymous ? 'Anonymous' : (donation.donor?.name || 'Unknown Donor')}
                            </span>
                            {!donation.isAnonymous && donation.donor?.email && (
                              <span className="donor-email">{donation.donor.email}</span>
                            )}
                            {donation.donor && (
                              <div className="donor-badges">
                                <span className={`role-badge ${donation.donor.role || 'donor'}`}>
                                  {donation.donor.role || 'donor'}
                                </span>
                                {donation.donor.isVerified && (
                                  <span className="verified-badge">✓ Verified</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="campaign-cell">
                          <span className="campaign-title">
                            {donation.campaign?.title || 'Campaign not found'}
                          </span>
                          <span className="campaign-status">
                            {donation.campaign?.status || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="amount-cell">
                          <span className="amount">{formatCurrency(donation.amount)}</span>
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`payment-status ${donation.paymentStatus}`}
                        >
                          {donation.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {donation.campaign?._id && (
                            <button
                              onClick={() => navigate(`/campaigns/${donation.campaign._id}`)}
                              className="action-btn-small secondary"
                            >
                              View Campaign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                  <span className="total-info">
                    ({pagination.total} total donations)
                  </span>
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="pagination-btn"
                >
                  Next
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

export default AdminDonorHistory;
