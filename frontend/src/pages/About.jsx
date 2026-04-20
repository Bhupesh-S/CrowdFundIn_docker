import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        {/* Hero Section */}
        <section className="about-hero">
          <h1 className="about-title">About CrowdFundIn</h1>
          <p className="about-subtitle">
            Empowering dreams through collective support
          </p>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="mission-content">
            <h2 className="section-title">Our Mission</h2>
            <p className="mission-text">
              At CrowdFundIn, we believe that great ideas deserve a chance to flourish. 
              Our platform connects passionate creators with generous supporters, making 
              it possible for innovative projects, meaningful causes, and entrepreneurial 
              ventures to come to life through the power of community funding.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="values-section">
          <h2 className="section-title text-center">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3 className="value-title">Trust & Transparency</h3>
              <p className="value-description">
                We maintain the highest standards of transparency in all transactions 
                and campaign management.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌟</div>
              <h3 className="value-title">Innovation</h3>
              <p className="value-description">
                We support groundbreaking ideas and innovative solutions that 
                make a positive impact.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">❤️</div>
              <h3 className="value-title">Community</h3>
              <p className="value-description">
                Building a supportive community where creators and backers 
                can connect meaningfully.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔒</div>
              <h3 className="value-title">Security</h3>
              <p className="value-description">
                Your financial information and personal data are protected 
                with bank-level security.
              </p>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="stats-section">
          <h2 className="section-title text-center">Our Impact</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Projects Funded</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">$50M+</div>
              <div className="stat-label">Total Raised</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100,000+</div>
              <div className="stat-label">Happy Backers</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <h2 className="section-title text-center">Meet Our Team</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">JD</div>
              <h3 className="member-name">John Doe</h3>
              <p className="member-role">CEO & Founder</p>
              <p className="member-bio">
                Passionate about connecting creators with their communities.
              </p>
            </div>
            <div className="team-member">
              <div className="member-avatar">JS</div>
              <h3 className="member-name">Jane Smith</h3>
              <p className="member-role">CTO</p>
              <p className="member-bio">
                Building secure and scalable platforms for the future.
              </p>
            </div>
            <div className="team-member">
              <div className="member-avatar">MB</div>
              <h3 className="member-name">Mike Brown</h3>
              <p className="member-role">Head of Marketing</p>
              <p className="member-bio">
                Helping creators tell their stories and reach their audience.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Your Journey?</h2>
            <p className="cta-text">
              Join thousands of creators and backers who are making amazing things happen.
            </p>
            <div className="cta-actions">
              <a href="/register" className="btn btn-primary btn-large">
                Get Started Today
              </a>
              <a href="/campaigns" className="btn btn-outline btn-large">
                Explore Campaigns
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
