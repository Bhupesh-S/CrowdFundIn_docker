import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../services/campaignService';
import { donationService } from '../services/donationService';
import CampaignOwnerProfile from '../components/CampaignOwnerProfile';
import DonationsReceived from '../components/DonationsReceived';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isCampaignOwner } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [activeTab, setActiveTab] = useState(isCampaignOwner ? 'campaigns' : 'donations');

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const promises = [];

      // Fetch user's campaigns if they're a campaign owner
      if (isCampaignOwner) {
        promises.push(
          campaignService.getUserCampaigns(user.id, { includeDonors: true }).then(data => {
            setCampaigns(data.campaigns || []);
          })
        );
      }

      // Fetch user's donations
      promises.push(
        donationService.getMyDonations().then(data => {
          setDonations(data.donations || []);
        }).catch(error => {
          console.error('Error fetching donations:', error);
          setDonations([]);
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, isCampaignOwner]);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [user, fetchDashboardData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (raised, goal) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'completed':
        return 'badge-primary';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="text-muted mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <h2>Please log in to view your dashboard</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="dashboard-header-section mb-4">
        <div className="text-center">
          <h1 className="dashboard-welcome-title">Welcome back, {user.name}!</h1>
          <p className="dashboard-welcome-subtitle">Here's what's happening with your account</p>
          <button 
            onClick={fetchDashboardData} 
            className="btn btn-outline-primary btn-sm mt-2"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-3 mb-4">
        {isCampaignOwner && (
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-primary">{campaigns.length}</h3>
              <p className="text-muted mb-0">Campaign{campaigns.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
        
        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-success">{donations.length}</h3>
            <p className="text-muted mb-0">Donation{donations.length !== 1 ? 's' : ''} Made</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <h3 className="text-primary">
              ${donations.reduce((total, donation) => total + donation.amount, 0).toLocaleString()}
            </h3>
            <p className="text-muted mb-0">Total Donated</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex gap-2">
            {isCampaignOwner && (
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`btn btn-small ${
                  activeTab === 'campaigns' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                My Campaigns
              </button>
            )}
            <button
              onClick={() => setActiveTab('donations')}
              className={`btn btn-small ${
                activeTab === 'donations' ? 'btn-primary' : 'btn-outline'
              }`}
            >
              My Donations
            </button>
            {isCampaignOwner && (
              <button
                onClick={() => setActiveTab('donations-received')}
                className={`btn btn-small ${
                  activeTab === 'donations-received' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <i className="fas fa-hand-holding-heart me-2"></i>
                Donations Received
              </button>
            )}
            {isCampaignOwner && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`btn btn-small ${
                  activeTab === 'profile' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <i className="fas fa-user me-2"></i>
                Profile
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && isCampaignOwner && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Your Campaigns</h3>
                <button 
                  onClick={() => navigate('/create-campaign')} 
                  className="btn btn-primary btn-small"
                >
                  Create New Campaign
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center">
                  <p className="text-muted">You haven't created any campaigns yet.</p>
                  <button 
                    onClick={() => navigate('/create-campaign')} 
                    className="btn btn-primary"
                  >
                    Create Your First Campaign
                  </button>
                </div>
              ) : (
                <div className="campaigns-full-width">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="campaign-card-full">
                      <div className="campaign-image-section">
                        {campaign.image && (
                          <img 
                            src={`http://localhost:5000${campaign.image}`} 
                            alt={campaign.title}
                            className="campaign-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      
                      <div className="campaign-content-section">
                        <div className="campaign-header">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h4 className="campaign-title">{campaign.title}</h4>
                            <span className={`badge ${getStatusBadgeClass(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </div>
                          
                          <p className="campaign-description">{campaign.description?.substring(0, 150)}...</p>
                          
                          <div className="campaign-progress mb-3">
                            <div className="d-flex justify-content-between text-sm mb-1">
                              <span>Progress</span>
                              <span>
                                ${campaign.currentAmount?.toLocaleString() || 0} / ${campaign.goalAmount?.toLocaleString()}
                              </span>
                            </div>
                            <div className="progress">
                              <div 
                                className="progress-bar"
                                style={{ width: `${getProgressPercentage(campaign.currentAmount || 0, campaign.goalAmount)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="campaign-donors-section">
                          <h5 className="donors-title">Recent Donations</h5>
                          {campaign.donors && campaign.donors.length > 0 ? (
                            <div className="donors-list">
                              {campaign.donors.slice(0, 5).map((donor, index) => (
                                <div key={index} className="donor-item">
                                  <div className="donor-info">
                                    <span className="donor-name">
                                      {donor.isAnonymous ? 'Anonymous' : (donor.user?.name || 'Anonymous')}
                                    </span>
                                    <span className="donor-amount">${donor.amount?.toLocaleString()}</span>
                                  </div>
                                  <div className="donor-date">
                                    {new Date(donor.donatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                              {campaign.donors.length > 5 && (
                                <div className="text-muted text-sm">
                                  +{campaign.donors.length - 5} more donors
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted">No donations yet</p>
                          )}
                        </div>
                        
                        <div className="campaign-actions">
                          <div className="campaign-meta">
                            <small className="text-muted">
                              Created {formatDate(campaign.createdAt)}
                            </small>
                            <small className="text-muted">
                              {campaign.donors?.length || 0} donors
                            </small>
                          </div>
                          <div className="d-flex gap-1">
                            <button 
                              onClick={() => window.location.href = `/campaigns/${campaign.id}`}
                              className="btn btn-outline btn-small"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => window.location.href = `/campaigns/${campaign.id}/edit`}
                              className="btn btn-primary btn-small"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Donations Tab */}
          {activeTab === 'donations' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Your Donations</h3>
                <div className="text-right">
                  <div className="text-primary font-weight-bold">
                    Total: ${donations.reduce((total, donation) => total + donation.amount, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {donations.length === 0 ? (
                <div className="text-center">
                  <p className="text-muted">You haven't made any donations yet.</p>
                  <button 
                    onClick={() => window.location.href = '/campaigns'} 
                    className="btn btn-primary"
                  >
                    Explore Campaigns
                  </button>
                </div>
              ) : (
                <div>
                  {donations.map((donation) => (
                    <div key={donation.id} className="d-flex align-items-center justify-content-between p-3 mb-2" 
                         style={{ border: '1px solid #e1e5e9', borderRadius: '8px' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="text-center">
                          <div className="text-success font-weight-bold">
                            ${donation.amount.toLocaleString()}
                          </div>
                          <small className="text-muted">
                            {formatDate(donation.createdAt)}
                          </small>
                        </div>
                        <div>
                          <h5 className="mb-1">
                            <a 
                              href={`/campaigns/${donation.campaignId}`}
                              className="text-decoration-none"
                            >
                              {donation.campaign?.title || 'Campaign'}
                            </a>
                          </h5>
                          {donation.comment && (
                            <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                              "{donation.comment}"
                            </p>
                          )}
                          {donation.isAnonymous && (
                            <small className="badge badge-warning">Anonymous</small>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => window.location.href = `/campaigns/${donation.campaignId}`}
                        className="btn btn-outline btn-small"
                      >
                        View Campaign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Donations Received Tab */}
          {activeTab === 'donations-received' && isCampaignOwner && (
            <DonationsReceived />
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && isCampaignOwner && (
            <CampaignOwnerProfile />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
