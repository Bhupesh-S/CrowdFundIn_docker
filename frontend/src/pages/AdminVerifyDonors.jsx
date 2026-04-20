import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminVerifyDonors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const navigate = useNavigate();

  const fetchUnverifiedDonors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUnverifiedDonors(filters);
      setDonors(data.donors);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch unverified donors');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUnverifiedDonors();
  }, [fetchUnverifiedDonors]);

  const handleVerifyDonor = async (donorId, isVerified, reason = null) => {
    try {
      setProcessing(prev => ({ ...prev, [donorId]: true }));
      await adminService.verifyUser(donorId, isVerified, reason);
      toast.success(`Donor ${isVerified ? 'approved' : 'rejected'} successfully`);
      fetchUnverifiedDonors();
      setSelectedDonor(null);
      setRejectionReason('');
    } catch (error) {
      toast.error(`Failed to ${isVerified ? 'approve' : 'reject'} donor`);
    } finally {
      setProcessing(prev => ({ ...prev, [donorId]: false }));
    }
  };

  const openRejectModal = (donor) => {
    setSelectedDonor(donor);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    handleVerifyDonor(selectedDonor._id, false, rejectionReason);
  };

  if (loading) {
    return (
      <AdminLayoutProfessional>
        <div className="admin-dashboard-page">
          <div className="container">
            <div className="admin-loading">
              <div className="loading-spinner"></div>
              <p>Loading unverified donors...</p>
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
            <h1 className="admin-title">Donor Verification</h1>
            <p className="admin-subtitle">Review and verify donor accounts</p>
          </div>

        {donors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>All caught up!</h3>
            <p>No donors pending verification at the moment.</p>
          </div>
        ) : (
          <>
            <div className="verification-list">
              {donors.map(donor => (
                <div key={donor._id} className="verification-card">
                  <div className="donor-info">
                    <div className="donor-avatar">
                      {donor.profilePicture ? (
                        <img src={donor.profilePicture} alt={donor.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {donor.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="donor-details">
                      <h3 className="donor-name">{donor.name}</h3>
                      <p className="donor-email">{donor.email}</p>
                      <div className="donor-meta">
                        <span className="donor-role">{donor.role}</span>
                        <span className="donor-date">
                          Registered: {new Date(donor.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {donor.bio && (
                        <p className="donor-bio">{donor.bio}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="donor-stats">
                    <div className="stat-item">
                      <span className="stat-label">Donations:</span>
                      <span className="stat-value">{donor.donations?.length || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Campaigns:</span>
                      <span className="stat-value">{donor.createdCampaigns?.length || 0}</span>
                    </div>
                  </div>

                  <div className="verification-actions">
                    <button
                      onClick={() => handleVerifyDonor(donor._id, true)}
                      disabled={processing[donor._id]}
                      className="action-btn approve"
                    >
                      {processing[donor._id] ? '...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => openRejectModal(donor)}
                      disabled={processing[donor._id]}
                      className="action-btn reject"
                    >
                      {processing[donor._id] ? '...' : '✗ Reject'}
                    </button>
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

        {/* Rejection Modal */}
        {selectedDonor && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Reject Donor</h3>
                <button 
                  onClick={() => {
                    setSelectedDonor(null);
                    setRejectionReason('');
                  }}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to reject <strong>{selectedDonor.name}</strong>?
                </p>
                <div className="form-group">
                  <label htmlFor="rejectionReason">Rejection Reason:</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows="4"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => {
                    setSelectedDonor(null);
                    setRejectionReason('');
                  }}
                  className="action-btn secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="action-btn reject"
                  disabled={!rejectionReason.trim()}
                >
                  Reject Donor
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

export default AdminVerifyDonors;
