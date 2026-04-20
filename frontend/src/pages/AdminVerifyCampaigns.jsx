import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminVerifyCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 8
  });
  const [pagination, setPagination] = useState({});
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const navigate = useNavigate();

  const fetchUnverifiedCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUnverifiedCampaigns(filters);
      setCampaigns(data.campaigns);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch unverified campaigns');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUnverifiedCampaigns();
  }, [fetchUnverifiedCampaigns]);

  const handleVerifyCampaign = async (campaignId, isVerified, reason = null) => {
    try {
      setProcessing(prev => ({ ...prev, [campaignId]: true }));
      await adminService.verifyCampaign(campaignId, isVerified, reason);
      toast.success(`Campaign ${isVerified ? 'approved' : 'rejected'} successfully`);
      fetchUnverifiedCampaigns();
      setSelectedCampaign(null);
      setRejectionReason('');
    } catch (error) {
      toast.error(`Failed to ${isVerified ? 'approve' : 'reject'} campaign`);
    } finally {
      setProcessing(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const openRejectModal = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    handleVerifyCampaign(selectedCampaign._id, false, rejectionReason);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayoutProfessional>
        <div className="admin-dashboard-page">
          <div className="container">
            <div className="admin-loading">
              <div className="loading-spinner"></div>
              <p>Loading unverified campaigns...</p>
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
            <h1 className="admin-title">Campaign Verification</h1>
          <p className="admin-subtitle">Review and approve campaign submissions</p>
        </div>

        {campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>All caught up!</h3>
            <p>No campaigns pending verification at the moment.</p>
          </div>
        ) : (
          <>
            <div className="campaigns-grid">
              {campaigns.map(campaign => (
                <div key={campaign._id} className="campaign-verification-card">
                  <div className="campaign-image">
                    {campaign.image ? (
                      <img src={campaign.image} alt={campaign.title} />
                    ) : (
                      <div className="image-placeholder">
                        <span>📷</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="campaign-content">
                    <div className="campaign-header">
                      <h3 className="campaign-title">{campaign.title}</h3>
                      <span className="campaign-category">{campaign.category}</span>
                    </div>
                    
                    <p className="campaign-description">
                      {campaign.description.length > 150 
                        ? `${campaign.description.substring(0, 150)}...`
                        : campaign.description
                      }
                    </p>

                    <div className="campaign-goals">
                      <div className="goal-item">
                        <span className="goal-label">Target:</span>
                        <span className="goal-value">{formatCurrency(campaign.goalAmount)}</span>
                      </div>
                      <div className="goal-item">
                        <span className="goal-label">Deadline:</span>
                        <span className="goal-value">
                          {new Date(campaign.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="campaign-owner">
                      <div className="owner-info">
                        <span className="owner-label">Created by:</span>
                        <div className="owner-details">
                          <span className="owner-name">{campaign.owner.name}</span>
                          <span className="owner-email">({campaign.owner.email})</span>
                          <span className={`verification-badge ${campaign.owner.isVerified ? 'verified' : 'unverified'}`}>
                            {campaign.owner.isVerified ? '✓ Verified' : '⚠ Unverified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="campaign-dates">
                      <span className="creation-date">
                        Created: {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="verification-actions">
                    <button
                      onClick={() => handleVerifyCampaign(campaign._id, true)}
                      disabled={processing[campaign._id]}
                      className="action-btn approve"
                    >
                      {processing[campaign._id] ? '...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => openRejectModal(campaign)}
                      disabled={processing[campaign._id]}
                      className="action-btn reject"
                    >
                      {processing[campaign._id] ? '...' : '✗ Reject'}
                    </button>
                    <button
                      onClick={() => navigate(`/campaigns/${campaign._id}`)}
                      className="action-btn secondary"
                    >
                      👁 View Details
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
        {selectedCampaign && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Reject Campaign</h3>
                <button 
                  onClick={() => {
                    setSelectedCampaign(null);
                    setRejectionReason('');
                  }}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to reject <strong>{selectedCampaign.title}</strong>?
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
                    setSelectedCampaign(null);
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
                  Reject Campaign
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

export default AdminVerifyCampaigns;
