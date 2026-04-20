import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import toast from 'react-hot-toast';
import './AdminDashboard.css';
import './AdminComplaints.css';

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
      setSelectedComplaint(null);
      setUpdateData({ status: '', adminNotes: '' });
      fetchComplaints();
    } catch (error) {
      toast.error('Failed to update complaint');
    } finally {
      setProcessing(prev => ({ ...prev, [selectedComplaint._id]: false }));
    }
  };

  const openUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({
      status: complaint.status || '',
      adminNotes: complaint.adminNotes || ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'investigating': return '#2196f3';
      case 'resolved': return '#4caf50';
      case 'rejected': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'investigating': return 'Investigating';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
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
          <div className="admin-header complaints-header">
            <div className="header-navigation">
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="back-btn modern-back-btn"
              >
                <span className="back-icon">←</span>
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="header-content">
              <div className="header-icon">
                <span className="icon">📋</span>
              </div>
              <div className="header-text">
                <h1 className="admin-title">Complaint Management</h1>
                <p className="admin-subtitle">Review and resolve user complaints efficiently</p>
              </div>
            </div>
            <div className="header-stats">
              <div className="stat-pill">
                <span className="stat-number">{complaints.length}</span>
                <span className="stat-label">Total Complaints</span>
              </div>
              <div className="stat-pill">
                <span className="stat-number">{complaints.filter(c => c.status === 'pending').length}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section modern-filters">
            <div className="filters-header">
              <h3 className="filters-title">
                <span className="filter-icon">🔍</span>
                Filter & Search
              </h3>
              <div className="results-count">
                Showing {complaints.length} of {pagination.total || complaints.length} complaints
              </div>
            </div>
            <div className="filter-controls">
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">
                    <span className="label-icon">📊</span>
                    Status
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                      className="modern-select"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">🟡 Pending</option>
                      <option value="investigating">🔵 Investigating</option>
                      <option value="resolved">🟢 Resolved</option>
                      <option value="rejected">🔴 Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    <span className="label-icon">📅</span>
                    Sort by
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={`${filters.sortBy}_${filters.order}`}
                      onChange={(e) => {
                        const [sortBy, order] = e.target.value.split('_');
                        setFilters(prev => ({ ...prev, sortBy, order, page: 1 }));
                      }}
                      className="modern-select"
                    >
                      <option value="createdAt_desc">🆕 Newest First</option>
                      <option value="createdAt_asc">📅 Oldest First</option>
                    </select>
                  </div>
                </div>

                <div className="filter-group">
                  <label className="filter-label">
                    <span className="label-icon">📄</span>
                    Per Page
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={filters.limit}
                      onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                      className="modern-select"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          {complaints.length === 0 ? (
            <div className="empty-state modern-empty-state">
              <div className="empty-animation">
                <div className="empty-icon">📋</div>
                <div className="empty-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div className="empty-content">
                <h3>No complaints found</h3>
                <p>No complaints match the current filters. Try adjusting your search criteria.</p>
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, status: 'all', page: 1 }))}
                  className="reset-filters-btn"
                >
                  🔄 Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="complaints-list modern-complaints">
                {complaints.map(complaint => (
                  <div key={complaint._id} className="complaint-card modern-card">
                    <div className="card-priority-indicator" 
                         style={{ backgroundColor: getStatusColor(complaint.status) }}></div>
                    
                    <div className="complaint-header">
                      <div className="complaint-meta">
                        <div className="complaint-title-row">
                          <h3 className="complaint-subject">
                            <span className="subject-icon">✉️</span>
                            {complaint.subject}
                          </h3>
                          <div className="complaint-status-modern">
                            <span 
                              className="status-badge modern-status-badge"
                              style={{ 
                                backgroundColor: getStatusColor(complaint.status),
                                color: 'white'
                              }}
                            >
                              <span className="status-dot"></span>
                              {getStatusLabel(complaint.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="complaint-info-grid">
                          <div className="info-item">
                            <span className="info-icon">👤</span>
                            <div className="info-content">
                              <span className="info-label">Reported by</span>
                              <span className="info-value">
                                <strong>{complaint.user?.name || 'Unknown User'}</strong>
                                {complaint.user?.email && (
                                  <span className="email-text">({complaint.user.email})</span>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-icon">🎯</span>
                            <div className="info-content">
                              <span className="info-label">Campaign</span>
                              <span className="info-value">
                                <strong>{complaint.campaign?.title || 'Unknown Campaign'}</strong>
                              </span>
                            </div>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-icon">📅</span>
                            <div className="info-content">
                              <span className="info-label">Date</span>
                              <span className="info-value">
                                {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="complaint-body">
                      <div className="description-section">
                        <h4 className="section-title">
                          <span className="section-icon">📝</span>
                          Description
                        </h4>
                        <p className="complaint-description">{complaint.description}</p>
                      </div>
                      
                      {complaint.adminNotes && (
                        <div className="admin-notes modern-admin-notes">
                          <h4 className="section-title">
                            <span className="section-icon">📜</span>
                            Admin Notes
                          </h4>
                          <div className="notes-content">
                            <p>{complaint.adminNotes}</p>
                            {complaint.resolvedBy && (
                              <div className="resolved-by">
                                <span className="resolved-icon">✓</span>
                                Handled by: <strong>{complaint.resolvedBy.name || 'Unknown Admin'}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="complaint-actions modern-actions">
                      <button
                        onClick={() => openUpdateModal(complaint)}
                        disabled={processing[complaint._id]}
                        className="action-btn primary modern-btn"
                      >
                        {processing[complaint._id] ? (
                          <span className="btn-loading">
                            <span className="loading-spinner small"></span>
                            Processing...
                          </span>
                        ) : (
                          <>
                            <span className="btn-icon">✏️</span>
                            <span>Update Status</span>
                          </>
                        )}
                      </button>
                      
                      {complaint.campaign?._id && (
                        <button
                          onClick={() => navigate(`/campaigns/${complaint.campaign._id}`)}
                          className="action-btn secondary modern-btn"
                        >
                          <span className="btn-icon">👁</span>
                          <span>View Campaign</span>
                        </button>
                      )}
                      
                      <div className="card-meta">
                        <span className="priority-indicator">
                          Priority: {complaint.status === 'pending' ? 'High' : 'Normal'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="pagination modern-pagination">
                  <div className="pagination-info">
                    <span className="pagination-text">
                      Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.total)} of {pagination.total} complaints
                    </span>
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn first"
                      disabled={pagination.currentPage === 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
                      title="First page"
                    >
                      «
                    </button>
                    <button
                      className="pagination-btn prev"
                      disabled={pagination.currentPage === 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: pagination.currentPage - 1 }))}
                      title="Previous page"
                    >
                      ‹ Previous
                    </button>
                    
                    <div className="page-numbers">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            className={`page-number ${pageNum === pagination.currentPage ? 'active' : ''}`}
                            onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      className="pagination-btn next"
                      disabled={pagination.currentPage === pagination.totalPages}
                      onClick={() => setFilters(prev => ({ ...prev, page: pagination.currentPage + 1 }))}
                      title="Next page"
                    >
                      Next ›
                    </button>
                    <button
                      className="pagination-btn last"
                      disabled={pagination.currentPage === pagination.totalPages}
                      onClick={() => setFilters(prev => ({ ...prev, page: pagination.totalPages }))}
                      title="Last page"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Update Modal */}
          {selectedComplaint && (
            <div className="modal-overlay modern-modal-overlay">
              <div className="modal modern-modal">
                <div className="modal-header modern-modal-header">
                  <div className="modal-title-section">
                    <div className="modal-icon">
                      <span>✏️</span>
                    </div>
                    <div>
                      <h3 className="modal-title">Update Complaint</h3>
                      <p className="modal-subtitle">Manage complaint status and add resolution notes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedComplaint(null);
                      setUpdateData({ status: '', adminNotes: '' });
                    }}
                    className="close-btn modern-close-btn"
                    title="Close modal"
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body modern-modal-body">
                  <div className="complaint-preview">
                    <h4 className="preview-title">
                      <span className="preview-icon">📝</span>
                      Complaint Details
                    </h4>
                    <div className="preview-content">
                      <p><strong>Subject:</strong> {selectedComplaint.subject}</p>
                      <p><strong>From:</strong> {selectedComplaint.user?.name || 'Unknown'}</p>
                      <p><strong>Current Status:</strong> 
                        <span 
                          className="status-badge mini"
                          style={{ 
                            backgroundColor: getStatusColor(selectedComplaint.status),
                            color: 'white',
                            marginLeft: '8px'
                          }}
                        >
                          {getStatusLabel(selectedComplaint.status)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="form-group modern-form-group">
                      <label className="form-label">
                        <span className="label-icon">📊</span>
                        Update Status
                        <span className="required">*</span>
                      </label>
                      <div className="select-wrapper">
                        <select
                          value={updateData.status}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                          className="form-control modern-select"
                        >
                          <option value="">Select New Status</option>
                          <option value="pending">🟡 Pending Review</option>
                          <option value="investigating">🔵 Under Investigation</option>
                          <option value="resolved">🟢 Resolved</option>
                          <option value="rejected">🔴 Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group modern-form-group">
                      <label className="form-label">
                        <span className="label-icon">📜</span>
                        Resolution Notes
                        <span className="optional">(optional)</span>
                      </label>
                      <textarea
                        value={updateData.adminNotes}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))}
                        className="form-control modern-textarea"
                        rows="4"
                        placeholder="Add detailed notes about the investigation, resolution, or next steps..."
                      />
                      <div className="char-count">
                        {updateData.adminNotes.length}/500 characters
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer modern-modal-footer">
                  <button
                    onClick={() => {
                      setSelectedComplaint(null);
                      setUpdateData({ status: '', adminNotes: '' });
                    }}
                    className="action-btn secondary modern-btn"
                  >
                    <span className="btn-icon">✕</span>
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleUpdateComplaint}
                    className="action-btn primary modern-btn"
                    disabled={!updateData.status || processing[selectedComplaint._id]}
                  >
                    {processing[selectedComplaint._id] ? (
                      <span className="btn-loading">
                        <span className="loading-spinner small"></span>
                        Updating...
                      </span>
                    ) : (
                      <>
                        <span className="btn-icon">✓</span>
                        <span>Update Complaint</span>
                      </>
                    )}
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