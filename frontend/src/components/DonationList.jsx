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
    const colors = ['var(--primary)', 'var(--accent)', '#28a745', '#dc3545', '#ffc107', '#17a2b8'];
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
            <div>
              {donations.map((donation, index) => (
                <div key={donation.id || donation._id || `donation-${index}`} className="d-flex align-items-center justify-content-between p-4 mb-3 bg-white shadow-sm" 
                     style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', transition: 'all 0.2s ease' }}>
                  
                  {/* Left Side: Avatar and Name */}
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="avatar"
                      style={{ 
                        backgroundColor: getAvatarColor(donation.donorName),
                        flexShrink: 0,
                        width: '48px',
                        height: '48px',
                        fontSize: '1.2rem'
                      }}
                    >
                      {getInitials(donation.donorName)}
                    </div>
                    <div>
                      <div className="mb-1">
                        <strong className="donation-donor-name" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          {donation.isAnonymous ? 'Anonymous' : donation.donorName}
                        </strong>
                        {donation.isAnonymous && (
                          <span className="badge ml-2" style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)', padding: '2px 6px', fontSize: '0.7rem', borderRadius: '4px', verticalAlign: 'middle' }}>ANONYMOUS</span>
                        )}
                      </div>
                      {donation.comment && (
                        <p className="text-muted mb-0" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                          "{donation.comment}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Amount and Date */}
                  <div className="text-right" style={{ minWidth: '120px' }}>
                    <div className="text-success font-weight-bold" style={{ fontSize: '1.25rem' }}>
                      ${donation.amount.toLocaleString()}
                    </div>
                    <small className="text-muted d-block mt-1">
                      {formatDate(donation.createdAt)}
                    </small>
                  </div>

                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="btn btn-outline btn-small"
                  style={{ boxShadow: 'none' }}
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
                        className={`btn btn-small ${pageNum === currentPage ? 'btn-primary' : 'btn-outline'}`}
                        style={{ 
                          minWidth: '40px', 
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
                  className="btn btn-outline btn-small"
                  style={{ boxShadow: 'none' }}
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
