import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    adminNotes: ''
  });
  const navigate = useNavigate();

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getComplaints(filters);
      setComplaints(data.complaints);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComplaints();
  }, [filters, fetchComplaints]);

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint || !updateData.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [selectedComplaint._id]: true }));
      await adminService.updateComplaint(selectedComplaint._id, updateData);
      toast.success('Complaint updated successfully');
      fetchComplaints();
      setSelectedComplaint(null);
      setUpdateData({ status: '', adminNotes: '' });
    } catch (error) {
      toast.error('Failed to update complaint');
    } finally {
      setProcessing(prev => ({ ...prev, [selectedComplaint._id]: false }));
    }
  };

  const openUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({
      status: complaint.status,
      adminNotes: complaint.adminNotes || ''
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

  if (loading) {
    return (
      <AdminLayoutProfessional>
        <div className="admin-dashboard-page">
          <div className="container">
            <div className="admin-loading">
              <div className="loading-spinner"></div>
              <p>Loading complaints...</p>
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
            <h1 className="admin-title">Complaint Management</h1>
            <p className="admin-subtitle">Review and resolve user complaints</p>
          </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Status:</label>
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
              <label>Sort By:</label>
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
              <label>Order:</label>
              <select
                value={filters.order}
                onChange={(e) => setFilters(prev => ({ ...prev, order: e.target.value, page: 1 }))}
                className="filter-select"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
        </div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No complaints found</h3>
            <p>No complaints match the current filters.</p>
          </div>
        ) : (
          <>
            <div className="complaints-list">
              {complaints.map(complaint => (
                <div key={complaint._id} className="complaint-card">
                  <div className="complaint-header">
                    <div className="complaint-meta">
                      <h3 className="complaint-subject">{complaint.subject}</h3>
                      <div className="complaint-info">
                        <span className="complaint-user">
                          By: <strong>{complaint.user?.name || 'Unknown User'}</strong> 
                          {complaint.user?.email && `(${complaint.user.email})`}
                        </span>
                        <span className="complaint-campaign">
                          Campaign: <strong>{complaint.campaign?.title || 'Unknown Campaign'}</strong>
                        </span>
                        <span className="complaint-date">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="complaint-status">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(complaint.status),
                          color: 'white'
                        }}
                      >
                        {getStatusLabel(complaint.status)}
                      </span>
                    </div>
                  </div>

                  <div className="complaint-body">
                    <p className="complaint-description">{complaint.description}</p>
                    
                    {complaint.adminNotes && (
                      <div className="admin-notes">
                        <strong>Admin Notes:</strong>
                        <p>{complaint.adminNotes}</p>
                        {complaint.resolvedBy && (
                          <small>
                            Handled by: {complaint.resolvedBy.name || 'Unknown Admin'} 
                          </small>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="complaint-actions">
                    <button
                      onClick={() => openUpdateModal(complaint)}
                      disabled={processing[complaint._id]}
                      className="action-btn primary"
                    >
                      {processing[complaint._id] ? '...' : '✏️ Update'}
                    </button>
                    {complaint.campaign?._id && (
                      <button
                        onClick={() => navigate(`/campaigns/${complaint.campaign._id}`)}
                        className="action-btn secondary"
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
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
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

        {/* Update Modal */}
        {selectedComplaint && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Update Complaint</h3>
                <button 
                  onClick={() => {
                    setSelectedComplaint(null);
                    setUpdateData({ status: '', adminNotes: '' });
                  }}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="complaint-summary">
                  <h4>{selectedComplaint.subject}</h4>
                  <p><strong>User:</strong> {selectedComplaint.user?.name || 'Unknown User'}</p>
                  <p><strong>Campaign:</strong> {selectedComplaint.campaign?.title || 'Unknown Campaign'}</p>
                  <p><strong>Description:</strong> {selectedComplaint.description}</p>
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
                    setSelectedComplaint(null);
                    setUpdateData({ status: '', adminNotes: '' });
                  }}
                  className="action-btn secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateComplaint}
                  className="action-btn primary"
                  disabled={!updateData.status || processing[selectedComplaint._id]}
                >
                  Update Complaint
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayoutProfessional>
  );
};

export default AdminComplaints;
