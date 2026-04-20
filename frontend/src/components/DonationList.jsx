import React, { useState, useEffect, useCallback } from 'react';
import './DonationList.css';
import { donationService } from '../services/donationService';
import toast from 'react-hot-toast';

const DonationList = ({ campaignId, refreshTrigger }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [donationCount, setDonationCount] = useState(0);

  const fetchDonations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await donationService.getCampaignDonations(campaignId, {
        page,
        limit: 10,
        sort: 'createdAt',
        order: 'desc'
      });

      setDonations(response.donations || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setCurrentPage(page);
      setTotalAmount(response.totalAmount || 0);
      setDonationCount(response.totalCount || 0);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchDonations(1);
    }
  }, [campaignId, refreshTrigger, fetchDonations]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name || name === 'Anonymous') return 'A';
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name || name === 'Anonymous') return '#6c757d';
    const colors = ['#667eea', '#764ba2', '#28a745', '#dc3545', '#ffc107', '#17a2b8'];
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchDonations(page);
    }
  };

  if (loading && donations.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner"></div>
          <p className="text-muted mt-2">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">Recent Donations</h3>
          {donationCount > 0 && (
            <div className="text-right">
              <div className="text-primary font-weight-bold">
                ${totalAmount.toLocaleString()}
              </div>
              <small className="text-muted">
                {donationCount} donation{donationCount !== 1 ? 's' : ''}
              </small>
            </div>
          )}
        </div>
      </div>
      
      <div className="card-body">
        {donations.length === 0 ? (
          <div className="text-center">
            <p className="text-muted mb-0">No donations yet.</p>
            <small className="text-muted">Be the first to support this campaign!</small>
          </div>
        ) : (
          <>
            <div className="donation-list">
              {donations.map((donation, index) => (
                <div key={donation.id || donation._id || `donation-${index}`} className="donation-item d-flex align-items-start gap-3 mb-3 pb-3" 
                     style={{ borderBottom: '1px solid #e1e5e9' }}>
                  <div 
                    className="avatar"
                    style={{ 
                      backgroundColor: getAvatarColor(donation.donorName),
                      flexShrink: 0
                    }}
                  >
                    {getInitials(donation.donorName)}
                  </div>
                  
                  <div className="flex-grow-1 min-width-0">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <strong className="donation-donor-name">
                          {donation.isAnonymous ? 'Anonymous' : donation.donorName}
                        </strong>
                        {donation.isAnonymous && donation.donorName && (
                          <small className="text-muted ml-2">(Anonymous)</small>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="donation-amount text-success font-weight-bold">
                          ${donation.amount.toLocaleString()}
                        </div>
                        <small className="text-muted">
                          {formatDate(donation.createdAt)}
                        </small>
                      </div>
                    </div>
                    
                    {donation.comment && (
                      <div className="donation-comment mt-1">
                        <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                          "{donation.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="btn minimal-btn btn-small"
                  style={{background: '#f5f6fa', color: '#2c3e50', border: '1px solid #e1e5e9', borderRadius: '8px', boxShadow: 'none'}}
                >
                  Previous
                </button>
                
                <div className="d-flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`btn minimal-btn btn-small`}
                        style={{ 
                          minWidth: '40px', 
                          background: pageNum === currentPage ? '#2c3e50' : '#f5f6fa',
                          color: pageNum === currentPage ? '#fff' : '#2c3e50',
                          border: '1px solid #e1e5e9',
                          borderRadius: '8px',
                          boxShadow: 'none',
                          fontWeight: pageNum === currentPage ? 700 : 500
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="btn minimal-btn btn-small"
                  style={{background: '#f5f6fa', color: '#2c3e50', border: '1px solid #e1e5e9', borderRadius: '8px', boxShadow: 'none'}}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DonationList;
