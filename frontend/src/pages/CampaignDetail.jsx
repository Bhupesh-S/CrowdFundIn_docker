import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './CampaignDetail.css';
import { campaignService } from '../services/campaignService';
import { 
  formatCurrency, 
  formatDate, 
  getDaysRemaining, 
  getProgressPercentage,
  getInitials,
  getRandomColor 
} from '../utils/helpers';
import ProgressBar from '../components/ProgressBar';
import DonationForm from '../components/DonationForm';
import DonationList from '../components/DonationList';
import CommentSection from '../components/CommentSection';
import SocialShare from '../components/SocialShare';
import CampaignUpdateNotifier from '../components/CampaignUpdateNotifier';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user info
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ id: payload.userId });
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }

    console.log('CampaignDetail: ID parameter:', id);
    if (id && id !== 'undefined') {
      fetchCampaign();
    } else {
      setError('Invalid campaign ID');
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCampaign = async () => {
    try {
      console.log('Fetching campaign with ID:', id);
      setLoading(true);
      const data = await campaignService.getCampaign(id);
      setCampaign(data.campaign || data);
    } catch (err) {
      setError('Campaign not found');
      console.error('Error fetching campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSuccess = async (donationData) => {
    // Refresh campaign data to show updated amount
    console.log('Donation success, refreshing campaign data...', donationData);
    await fetchCampaign();
    console.log('Campaign data refreshed');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: '80px 0' }}>
          <div className="spinner"></div>
          <p className="text-muted mt-3">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: '80px 0' }}>
          <h2 className="text-muted">{error || 'Campaign not found'}</h2>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/campaigns')}
          >
            Browse Campaigns
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(campaign.deadline);
  const progressPercentage = getProgressPercentage(campaign.currentAmount, campaign.goalAmount);
  const isExpired = daysRemaining === 0;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      {/* Breadcrumb */}
      <nav className="mb-4">
        <Link to="/campaigns" className="text-muted">
          ← Back to Campaigns
        </Link>
      </nav>

      <div className="grid grid-2 gap-4">
        {/* Left Column - Image and Description */}
        <div>
          <div 
            className="campaign-main-image"
            style={{
              height: '400px',
              backgroundImage: campaign.image 
                ? `url(http://localhost:5000${campaign.image})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              marginBottom: '30px',
              position: 'relative'
            }}
          >
            {campaign.category && (
              <span className="badge badge-primary" style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                fontSize: '14px'
              }}>
                {campaign.category}
              </span>
            )}
            {isExpired && (
              <span className="badge badge-danger" style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '14px'
              }}>
                Campaign Ended
              </span>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2>About this campaign</h2>
            </div>
            <div className="card-body">
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {campaign.description || 'No description provided.'}
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="card mt-4">
            <div className="card-header">
              <h3>About the creator</h3>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="avatar avatar-lg"
                  style={{ backgroundColor: getRandomColor() }}
                >
                  {campaign.owner?.profilePicture ? (
                    <img 
                      src={campaign.owner.profilePicture} 
                      alt={campaign.owner.name || campaign.owner.username} 
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    getInitials(campaign.owner?.name || campaign.owner?.username || 'Anonymous')
                  )}
                </div>
                <div>
                  <h4 className="mb-1">
                    {campaign.owner?.name || campaign.owner?.username || 'Anonymous'}
                  </h4>
                  <p className="text-muted mb-0">
                    Campaign Creator
                  </p>
                  {campaign.owner?.bio && (
                    <p className="mt-2">{campaign.owner.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Update Notifier - Only for campaign owner */}
          {currentUser && campaign.owner && currentUser.id === campaign.owner._id && (
            <div className="card mt-4">
              <div className="card-header">
                <h3>Notify Your Supporters</h3>
              </div>
              <div className="card-body">
                <CampaignUpdateNotifier 
                  campaignId={campaign._id}
                  campaignTitle={campaign.title}
                  onUpdateSent={(data) => {
                    console.log('Update sent to donors:', data);
                    // Could show a success message or refresh campaign data
                  }}
                />
              </div>
            </div>
          )}

          {/* Recent Donations */}
          <div className="card mt-4">
            <div className="card-header">
              <h3>Recent Donations</h3>
            </div>
            <div className="card-body">
              <DonationList campaignId={campaign._id} />
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection campaignId={campaign._id} />
        </div>

        {/* Right Column - Campaign Stats and Donation */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '20px' }}>
            <div className="card-body">
              <h1 className="card-title">{campaign.title}</h1>
              
              {/* Social Share Buttons */}
              <SocialShare 
                campaign={{
                  id: campaign._id,
                  title: campaign.title,
                  description: campaign.description,
                  image: campaign.image,
                  url: window.location.href,
                  currentAmount: campaign.currentAmount || 0,
                  goalAmount: campaign.goalAmount
                }}
              />
              
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h2 className="text-primary mb-0">
                    {formatCurrency(campaign.currentAmount || 0)}
                  </h2>
                  <span className="badge badge-success">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-muted mb-3">
                  pledged of {formatCurrency(campaign.goalAmount)} goal
                </p>
                
                <ProgressBar 
                  current={campaign.currentAmount || 0} 
                  goal={campaign.goalAmount} 
                  className="mb-3"
                />

                <div className="d-flex justify-content-between text-center">
                  <div>
                    <div className="h4 mb-0">{campaign.donors?.length || 0}</div>
                    <small className="text-muted">backers</small>
                  </div>
                  <div>
                    <div className="h4 mb-0">{daysRemaining}</div>
                    <small className="text-muted">days to go</small>
                  </div>
                  <div>
                    <div className="h4 mb-0">
                      {formatDate(campaign.createdAt)}
                    </div>
                    <small className="text-muted">launched</small>
                  </div>
                </div>
              </div>

              {!isExpired ? (
                <DonationForm 
                  campaign={campaign} 
                  onSuccess={handleDonationSuccess}
                />
              ) : (
                <div className="text-center py-4">
                  <h3 className="text-muted">Campaign Ended</h3>
                  <p className="text-muted">
                    This campaign ended on {formatDate(campaign.deadline)}
                  </p>
                  {progressPercentage >= 100 ? (
                    <div className="alert alert-success">
                      Campaign successfully funded!
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      Campaign did not reach its funding goal
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e1e5e9' }}>
                <h4>Campaign Details</h4>
                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Deadline:</span>
                    <span>{formatDate(campaign.deadline)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Created:</span>
                    <span>{formatDate(campaign.createdAt)}</span>
                  </div>
                  {campaign.category && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Category:</span>
                      <span>{campaign.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
