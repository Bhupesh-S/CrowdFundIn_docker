import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { campaignService } from '../services/campaignService';
import { donationService } from '../services/donationService';
import { toast } from 'react-hot-toast';
import './DonationsReceived.css';

const DonationsReceived = () => {
  const { user } = useAuth();
  const [allDonations, setAllDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'donor', 'campaign'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDonations, setTotalDonations] = useState(0);
  const donationsPerPage = 10;

  const fetchAllDonations = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // First, get all user's campaigns
      const userCampaignsResponse = await campaignService.getUserCampaigns(user.id);
      const userCampaigns = userCampaignsResponse.campaigns || [];
      console.log('User campaigns:', userCampaigns);
      
      // Then fetch donations for each campaign
      const allDonationsPromises = userCampaigns.map(async (campaign) => {
        try {
          const response = await donationService.getCampaignDonations(campaign.id || campaign._id, {
            page: 1,
            limit: 1000
          });
          
          return response.donations.map(donation => ({
            ...donation,
            campaignTitle: campaign.title,
            campaignId: campaign.id || campaign._id
          }));
        } catch (error) {
          console.error(`Error fetching donations for campaign ${campaign.id || campaign._id}:`, error);
          return [];
        }
      });
      
      const allDonationsArrays = await Promise.all(allDonationsPromises);
      const flattenedDonations = allDonationsArrays.flat();
      
      // Sort donations
      const sortedDonations = flattenedDonations.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'date':
            comparison = new Date(a.createdAt) - new Date(b.createdAt);
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'donor':
            const nameA = a.donor?.name || 'Anonymous';
            const nameB = b.donor?.name || 'Anonymous';
            comparison = nameA.localeCompare(nameB);
            break;
          case 'campaign':
            comparison = a.campaignTitle.localeCompare(b.campaignTitle);
            break;
          default:
            comparison = 0;
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });
      
      setAllDonations(sortedDonations);
      setTotalDonations(sortedDonations.length);
      
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError('Failed to load donations');
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [user, sortBy, sortOrder]);

  useEffect(() => {
    fetchAllDonations();
  }, [fetchAllDonations]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
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

  const formatAmount = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Pagination
  const indexOfLastDonation = currentPage * donationsPerPage;
  const indexOfFirstDonation = indexOfLastDonation - donationsPerPage;
  const currentDonations = allDonations.slice(indexOfFirstDonation, indexOfLastDonation);
  const totalPages = Math.ceil(totalDonations / donationsPerPage);

  const getTotalAmount = () => {
    return allDonations.reduce((total, donation) => total + donation.amount, 0);
  };

  if (loading) {
    return (
      <div className="donations-received-container">
        <div className="donations-received-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading donations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="donations-received-container">
        <div className="donations-received-wrapper">
          <div className="error-container">
            <div className="warning-alert">
              <i className="fas fa-exclamation-triangle"></i> 
              Please log in to view your donations.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="donations-received-container">
        <div className="donations-received-wrapper">
          <div className="error-container">
            <div className="error-alert">
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
            <button onClick={fetchAllDonations} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="donations-received-container">
      <div className="donations-received-wrapper">
        {/* Header with stats */}
        <div className="donations-header">
          <div className="donations-header-content">
            <h1 className="donations-title">Donations Received</h1>
            <p className="donations-subtitle">
              All donations received across your campaigns
            </p>
          </div>
          <div className="donations-stats">
            <h2 className="total-amount">
              {formatAmount(getTotalAmount())}
            </h2>
            <div className="donations-count">
              <i className="fas fa-heart"></i>
              {totalDonations} donation{totalDonations !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Donations Table */}
        {allDonations.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-heart empty-state-icon"></i>
            <h3 className="empty-state-title">No donations received yet</h3>
            <p className="empty-state-description">
              Once people start donating to your campaigns, you'll see them here.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="donations-table-container">
              <div className="table-responsive">
                <table className="donations-table">
                  <thead>
                    <tr>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('donor')}
                      >
                        Donor <span className="sort-icon">{getSortIcon('donor')}</span>
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('amount')}
                      >
                        Amount <span className="sort-icon">{getSortIcon('amount')}</span>
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('date')}
                      >
                        Date <span className="sort-icon">{getSortIcon('date')}</span>
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('campaign')}
                      >
                        Campaign <span className="sort-icon">{getSortIcon('campaign')}</span>
                      </th>
                      <th>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDonations.map((donation, index) => (
                      <tr key={donation._id || index}>
                    <td>
                      <div className="donor-info">
                        {donation.donor?.profilePicture ? (
                          <img 
                            src={`http://localhost:5000${donation.donor.profilePicture}`}
                            alt={donation.donor.name}
                            className="donor-avatar"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="donor-avatar">
                            {(donation.donor?.name || 'A')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="donor-details">
                          <div className="donor-name">
                            {donation.donor?.name || 'Anonymous'}
                            {donation.isAnonymous && (
                              <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: 'var(--warning-100)', color: 'var(--warning-700)', padding: '2px 6px', borderRadius: '4px' }}>
                                Anonymous
                              </span>
                            )}
                          </div>
                          {donation.donor?.email && (
                            <div className="donor-email">
                              {donation.donor.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="donation-amount">
                        {formatAmount(donation.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="donation-date">
                        {formatDate(donation.createdAt)}
                      </span>
                    </td>
                    <td>
                      <a 
                        href={`/campaigns/${donation.campaignId}`}
                        className="campaign-link"
                      >
                        {donation.campaignTitle}
                      </a>
                    </td>
                    <td>
                      {donation.comment ? (
                        <span className="donation-comment">
                          "{donation.comment}"
                        </span>
                      ) : (
                        <span className="donation-comment empty">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {indexOfFirstDonation + 1} to {Math.min(indexOfLastDonation, totalDonations)} of {totalDonations} donations
                </div>
                <div className="pagination-controls">
                  <button 
                    className="pagination-button"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button 
                          key={pageNumber}
                          className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <span key={pageNumber} className="pagination-button" style={{cursor: 'default'}}>
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  
                  <button 
                    className="pagination-button"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default DonationsReceived;