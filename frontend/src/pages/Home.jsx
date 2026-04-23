import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { campaignService } from '../services/campaignService';
import CampaignCard from '../components/CampaignCard';

const CountUp = ({ end, duration = 1200, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let startTimestamp = null;
        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          // ease-out calculation
          const p = Math.min((timestamp - startTimestamp) / duration, 1);
          const easeOut = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(easeOut * end));
          if (p < 1) {
            window.requestAnimationFrame(step);
          }
        };
        window.requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

const ScrollReveal = ({ children, className, staggerIndex = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`${className} ${isVisible ? 'is-visible' : ''}`}
      style={isVisible ? { animationDelay: `${staggerIndex * 120}ms` } : {}}
    >
      {children}
    </div>
  );
};

const SectionHeading = ({ title, subtitle, style, colorClass }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`home-section-header ${colorClass || ''}`} ref={ref} style={style}>
      <h2 className="home-section-title">{title}</h2>
      <p className="home-section-subtitle">{subtitle}</p>
    </div>
  );
};

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

  const activeCount = featuredCampaigns.length + recentCampaigns.length;

  return (
    <div className="home-page fade-up-mount">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title hero-fade-1">
            Fund the Future
          </h1>
          <p className="hero-subtitle hero-fade-2">
            Discover amazing projects and help bring innovative ideas to life through crowdfunding
          </p>
          <div className="hero-actions hero-fade-3">
            <Link to="/campaigns" className="btn btn-primary btn-large">
              Explore Campaigns
            </Link>
            <Link to="/create-campaign" className="btn btn-outline btn-large" style={{ backgroundColor: 'transparent' }}>
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
          <SectionHeading 
            title="Featured Campaigns" 
            subtitle="Discover the most successful and trending campaigns on our platform" 
          />
          
          {featuredCampaigns.length > 0 ? (
            <div className="featured-campaigns">
              {featuredCampaigns.map((campaign, index) => (
                <ScrollReveal key={campaign._id} className="scroll-fade-up" staggerIndex={index % 3}>
                  <CampaignCard campaign={campaign} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No featured campaigns available</p>
            </div>
          )}

          <div className="view-all-campaigns">
            <Link to="/campaigns" className="btn btn-primary btn-large">
              View All Campaigns
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="home-section-header" style={{ color: 'white' }}>
            <h2 className="home-section-title" style={{ color: 'white' }}>Platform Statistics</h2>
            <p className="home-section-subtitle" style={{ color: 'white' }}>
              See the impact of our community in numbers
            </p>
          </div>
          <div className="stats-grid">
            <ScrollReveal className="home-stat-card" staggerIndex={0}>
              <span className="stat-number">
                <CountUp end={activeCount} suffix="+" />
              </span>
              <div className="stat-label">Active Campaigns</div>
            </ScrollReveal>
            <ScrollReveal className="home-stat-card" staggerIndex={1}>
              <span className="stat-number">
                <CountUp prefix="$" end={50} suffix="K+" />
              </span>
              <div className="stat-label">Funds Raised</div>
            </ScrollReveal>
            <ScrollReveal className="home-stat-card" staggerIndex={2}>
              <span className="stat-number">
                <CountUp end={1000} suffix="+" />
              </span>
              <div className="stat-label">Backers</div>
            </ScrollReveal>
            <ScrollReveal className="home-stat-card" staggerIndex={3}>
              <span className="stat-number">
                <CountUp end={95} suffix="%" />
              </span>
              <div className="stat-label">Success Rate</div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <SectionHeading 
            title="How It Works" 
            subtitle="Get started with crowdfunding in three simple steps" 
          />
          <div className="steps-grid">
            <ScrollReveal className="step-card card" staggerIndex={0}>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="step-title">Create Your Campaign</h3>
              <p className="step-description">
                Set up your project with compelling content, images, and a clear funding goal
              </p>
            </ScrollReveal>
            <ScrollReveal className="step-card card" staggerIndex={1}>
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
            </ScrollReveal>
            <ScrollReveal className="step-card card" staggerIndex={2}>
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
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Recent Campaigns */}
      <section className="featured-section">
        <div className="featured-container">
          <SectionHeading 
            title="Recent Campaigns" 
            subtitle="Check out the latest projects that need your support" 
          />
          
          {recentCampaigns.length > 0 ? (
            <div className="featured-campaigns">
              {recentCampaigns.slice(0, 6).map((campaign, index) => (
                <ScrollReveal key={campaign._id} className="scroll-fade-up" staggerIndex={index % 3}>
                  <CampaignCard campaign={campaign} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No recent campaigns available</p>
            </div>
          )}

          <div className="view-all-campaigns">
            <Link to="/campaigns" className="btn btn-primary btn-large">
              View All Campaigns
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title" style={{ color: 'white' }}>Ready to Start Your Campaign?</h2>
          <p className="cta-subtitle" style={{ color: 'white' }}>
            Join thousands of creators who have successfully funded their projects
          </p>
          <div className="cta-actions">
            <Link to="/create-campaign" className="btn" style={{ background: 'white', color: 'var(--primary)' }}>
              Start Your Campaign Today
            </Link>
            <Link to="/campaigns" className="btn" style={{ background: 'transparent', color: 'white', border: '1px solid white' }}>
              Explore Existing Campaigns
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
