import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { campaignService } from '../services/campaignService';
import CampaignCard from '../components/CampaignCard';

const Home = () => {
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const [featured, recent] = await Promise.all([
        campaignService.getAllCampaigns({ limit: 6, sort: 'currentAmount', order: 'desc', status: 'all' }),
        campaignService.getAllCampaigns({ limit: 8, sort: 'createdAt', order: 'desc', status: 'all' })
      ]);
      
      setFeaturedCampaigns(featured.campaigns || featured);
      setRecentCampaigns(recent.campaigns || recent);
    } catch (err) {
      setError('Failed to load campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: '80px 0' }}>
          <div className="spinner"></div>
          <p className="text-muted mt-3">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title" style={{ color: "WHITE" }}>
            Fund the Future
          </h1>
          <p className="hero-subtitle" style={{ color: "WHITE" }}>
            Discover amazing projects and help bring innovative ideas to life through crowdfunding
          </p>
          <div className="hero-actions">
            <Link to="/campaigns" className="hero-btn hero-btn-primary">
              Explore Campaigns
            </Link>
            <Link to="/create-campaign" className="hero-btn hero-btn-secondary">
              Start a Campaign
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="container mt-4">
          <div className="alert alert-error">
            {error}
          </div>
        </div>
      )}

      {/* Featured Campaigns */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="section-header">
            <h2 className="section-title">Featured Campaigns</h2>
            <p className="section-subtitle">
              Discover the most successful and trending campaigns on our platform
            </p>
          </div>
          
          {featuredCampaigns.length > 0 ? (
            <div className="featured-campaigns">
              {featuredCampaigns.map(campaign => (
                <CampaignCard key={campaign._id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No featured campaigns available</p>
            </div>
          )}

          <div className="view-all-campaigns">
            <Link to="/campaigns" className="view-all-btn">
              View All Campaigns
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="section-header">
            <h2 className="section-title" style={{ color: "WHITE" }}>Platform Statistics</h2>
            <p className="section-subtitle" style={{ color: "WHITE" }}>
              See the impact of our community in numbers
            </p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">
                {featuredCampaigns.length + recentCampaigns.length}+
              </span>
              <div className="stat-label">Active Campaigns</div>
            </div>
            <div className="stat-card">
              <span className="stat-number">$50K+</span>
              <div className="stat-label">Funds Raised</div>
            </div>
            <div className="stat-card">
              <span className="stat-number">1000+</span>
              <div className="stat-label">Backers</div>
            </div>
            <div className="stat-card">
              <span className="stat-number">95%</span>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get started with crowdfunding in three simple steps
            </p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="step-title">Create Your Campaign</h3>
              <p className="step-description">
                Set up your project with compelling content, images, and a clear funding goal
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="step-title">Share & Promote</h3>
              <p className="step-description">
                Spread the word through social media and your network to reach potential backers
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <h3 className="step-title">Receive Funding</h3>
              <p className="step-description">
                Collect funds from backers and bring your project to life
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Campaigns */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="section-header">
            <h2 className="section-title">Recent Campaigns</h2>
            <p className="section-subtitle">
              Check out the latest projects that need your support
            </p>
          </div>
          
          {recentCampaigns.length > 0 ? (
            <div className="featured-campaigns">
              {recentCampaigns.slice(0, 6).map(campaign => (
                <CampaignCard key={campaign._id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No recent campaigns available</p>
            </div>
          )}

          <div className="view-all-campaigns">
            <Link to="/campaigns" className="view-all-btn">
              View All Campaigns
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Start Your Campaign?</h2>
          <p className="cta-subtitle" style={{ color: "WHITE" }}>
            Join thousands of creators who have successfully funded their projects
          </p>
          <div className="cta-actions">
            <Link to="/create-campaign" className="cta-btn cta-btn-primary">
              Start Your Campaign Today
            </Link>
            <Link to="/campaigns" className="cta-btn cta-btn-outline">
              Explore Existing Campaigns
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
