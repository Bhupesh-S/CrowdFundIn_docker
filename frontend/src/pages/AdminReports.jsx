import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import toast from 'react-hot-toast';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import './AdminPagesProfessional.css';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [updating, setUpdating] = useState({});
  const [updateData, setUpdateData] = useState({
    status: '',
    adminNotes: ''
  });
  const navigate = useNavigate();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Using the reports endpoint which is an alias for complaints
      const response = await fetch(`/api/admin/reports?${new URLSearchParams(filters)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data.reports);
      setPagination(data.pagination);
    } catch (error) {
      setError('Failed to fetch reports. Please try again.');
      console.error('Fetch reports error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [filters, fetchReports]);

  const handleUpdateReport = async () => {
    if (!selectedReport || !updateData.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [selectedReport._id]: true }));
      await adminService.updateComplaint(selectedReport._id, updateData);
      toast.success('Report updated successfully');
      fetchReports();
      setSelectedReport(null);
      setUpdateData({ status: '', adminNotes: '' });
    } catch (error) {
      toast.error('Failed to update report');
      console.error('Update report error:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [selectedReport._id]: false }));
    }
  };

  const openUpdateModal = (report) => {
    setSelectedReport(report);
    setUpdateData({
      status: report.status,
      adminNotes: report.adminNotes || ''
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      in_review: '#17a2b8',
      resolved: '#28a745',
      dismissed: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      in_review: 'In Review',
      resolved: 'Resolved',
      dismissed: 'Dismissed'
    };
    return labels[status] || status;
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
          <button className="retry-btn" onClick={fetchReports}>
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
            <h1 className="page-title">Reports & Complaints</h1>
            <p className="page-description">Review and manage user reports and complaints</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{pagination.total || 0}</span>
              <span className="stat-label">Total Reports</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-form">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="createdAt">Date Created</option>
                <option value="status">Status</option>
                <option value="subject">Subject</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Order</label>
              <select
                value={filters.order}
                onChange={(e) => setFilters(prev => ({ ...prev, order: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="content-card">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No reports found</h3>
              <p>No reports match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="reports-list">
                {reports.map(report => (
                  <div key={report._id} className="report-card">
                    <div className="report-header">
                      <div className="report-meta">
                        <h3 className="report-subject">{report.subject}</h3>
                        <div className="report-info">
                          <div className="info-item">
                            <span className="info-label">Reporter:</span>
                            <span className="info-value">
                              <strong>{report.user?.name || 'Unknown User'}</strong>
                              {report.user?.email && ` (${report.user.email})`}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Campaign:</span>
                            <span className="info-value">
                              <strong>{report.campaign?.title || 'Unknown Campaign'}</strong>
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Date:</span>
                            <span className="info-value">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="report-status">
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(report.status),
                            color: 'white'
                          }}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                    </div>

                    <div className="report-body">
                      <div className="report-description">
                        <h5>Description:</h5>
                        <p>{report.description}</p>
                      </div>
                      
                      {report.adminNotes && (
                        <div className="admin-notes">
                          <h5>Admin Notes:</h5>
                          <p>{report.adminNotes}</p>
                          {report.resolvedBy && (
                            <small>
                              Handled by: {report.resolvedBy.name || 'Unknown Admin'}
                            </small>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="report-actions">
                      <button
                        onClick={() => openUpdateModal(report)}
                        disabled={updating[report._id]}
                        className="action-btn edit-btn"
                      >
                        {updating[report._id] ? '...' : '✏️ Update'}
                      </button>
                      {report.campaign?._id && (
                        <button
                          onClick={() => navigate(`/campaigns/${report.campaign._id}`)}
                          className="action-btn view-btn"
                        >
                          👁 View Campaign
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                    <span className="total-info">({pagination.total} total reports)</span>
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

        {/* Update Modal */}
        {selectedReport && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Update Report</h3>
                <button 
                  onClick={() => {
                    setSelectedReport(null);
                    setUpdateData({ status: '', adminNotes: '' });
                  }}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="report-summary">
                  <h4>{selectedReport.subject}</h4>
                  <p><strong>Reporter:</strong> {selectedReport.user?.name || 'Unknown User'}</p>
                  <p><strong>Campaign:</strong> {selectedReport.campaign?.title || 'Unknown Campaign'}</p>
                  <p><strong>Description:</strong> {selectedReport.description}</p>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status:</label>
                  <select
                    id="status"
                    value={updateData.status}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    className="form-control"
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="adminNotes">Admin Notes:</label>
                  <textarea
                    id="adminNotes"
                    value={updateData.adminNotes}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    placeholder="Add notes about your decision or actions taken..."
                    rows="4"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setUpdateData({ status: '', adminNotes: '' });
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateReport}
                  className="save-btn"
                  disabled={!updateData.status || updating[selectedReport._id]}
                >
                  Update Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutProfessional>
  );
};

export default AdminReports;
