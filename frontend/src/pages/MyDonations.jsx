import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../services/donationService.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';
import toast from 'react-hot-toast';
import './MyDonations.css';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await donationService.getMyDonations({ page: currentPage, limit: 10 });
      setDonations(data.donations);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDonations();
  }, [user, navigate, currentPage, fetchDonations]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const totalDonated = donations.reduce((sum, donation) => sum + donation.amount, 0);

  if (loading) {
    return (
      <div className="my-donations-page">
        <div className="container">
          <div className="donations-loading">
            <div className="loading-spinner"></div>
            <p>Loading your donations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-donations-page">
      <div className="container">
        {/* Header */}
        <div className="donations-header">
          <h1 className="donations-title">My Donations</h1>
          <p className="donations-subtitle">
            Thank you for supporting amazing campaigns!
          </p>
        </div>

        {/* Summary Stats */}
        <div className="donations-summary">
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <div className="summary-value">{formatCurrency(totalDonated)}</div>
              <div className="summary-label">Total Donated</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <div className="summary-value">{donations.length}</div>
              <div className="summary-label">Campaigns Supported</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">❤️</div>
            <div className="summary-content">
              <div className="summary-value">
                {donations.filter(d => !d.isAnonymous).length}
              </div>
              <div className="summary-label">Public Donations</div>
            </div>
          </div>
        </div>

        {/* Donations List */}
        <div className="donations-content">
          {donations.length > 0 ? (
            <>
              <div className="donations-list">
                {donations.map((donation) => (
                  <div key={donation._id} className="donation-card">
                    <div className="donation-campaign-info">
                      {donation.campaign.image ? (
                        <img 
                          src={`http://localhost:5000${donation.campaign.image}`}
                          alt={donation.campaign.title}
                          className="campaign-thumbnail"
                        />
                      ) : (
                        <div className="campaign-thumbnail-placeholder">
                          🎯
                        </div>
                      )}
                      <div className="campaign-details">
                        <h3 className="campaign-title">{donation.campaign.title}</h3>
                        <div className="campaign-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ 
                                width: `${Math.min((donation.campaign.currentAmount / donation.campaign.goalAmount) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="progress-text">
                            {formatCurrency(donation.campaign.currentAmount)} raised of {formatCurrency(donation.campaign.goalAmount)}
                          </div>
                        </div>
                        <div className="campaign-status">
                          <span className={`status-badge ${donation.campaign.status}`}>
                            {donation.campaign.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="donation-details">
                      <div className="donation-amount">
                        {formatCurrency(donation.amount)}
                      </div>
                      <div className="donation-date">
                        {formatDate(donation.createdAt)}
                      </div>
                      <div className="donation-type">
                        {donation.isAnonymous ? (
                          <span className="anonymous-badge">Anonymous</span>
                        ) : (
                          <span className="public-badge">Public</span>
                        )}
                      </div>
                      {donation.message && (
                        <div className="donation-message">
                          "{donation.message}"
                        </div>
                      )}
                    </div>

                    <div className="donation-actions">
                      <button 
                        onClick={() => navigate(`/campaigns/${donation.campaign._id}`)}
                        className="view-campaign-btn"
                      >
                        View Campaign
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination-section">
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="pagination-btn"
                    >
                      ←
                    </button>
                    
                    {[...Array(pagination.totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="pagination-btn"
                    >
                      →
                    </button>
                  </div>
                  <div className="pagination-info">
                    Showing {donations.length} of {pagination.totalDonations} donations
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-donations">
              <div className="empty-icon">💝</div>
              <h2 className="empty-title">No Donations Yet</h2>
              <p className="empty-description">
                You haven't made any donations yet. Start supporting amazing campaigns today!
              </p>
              <button 
                onClick={() => navigate('/campaigns')}
                className="browse-campaigns-btn"
              >
                Browse Campaigns
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyDonations;
