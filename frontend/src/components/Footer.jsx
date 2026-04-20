import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#333',
      color: 'white',
      padding: '40px 0',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}>
          <div>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#667eea', 
              marginBottom: '16px' 
            }}>
              CrowdFundIn
            </h3>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              Empowering dreams through community support. Join us in making a difference, 
              one campaign at a time.
            </p>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '16px', color: 'white' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="/" style={{ color: '#ccc', textDecoration: 'none' }}>Home</a>
              <a href="/campaigns" style={{ color: '#ccc', textDecoration: 'none' }}>Browse Campaigns</a>
              <a href="/how-it-works" style={{ color: '#ccc', textDecoration: 'none' }}>How It Works</a>
              <a href="/about" style={{ color: '#ccc', textDecoration: 'none' }}>About Us</a>
            </div>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '16px', color: 'white' }}>Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="/help" style={{ color: '#ccc', textDecoration: 'none' }}>Help Center</a>
              <a href="/contact" style={{ color: '#ccc', textDecoration: 'none' }}>Contact Us</a>
              <a href="/privacy" style={{ color: '#ccc', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms" style={{ color: '#ccc', textDecoration: 'none' }}>Terms of Service</a>
            </div>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '16px', color: 'white' }}>Follow Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="https://facebook.com" style={{ color: '#ccc', textDecoration: 'none' }}>Facebook</a>
              <a href="https://twitter.com" style={{ color: '#ccc', textDecoration: 'none' }}>Twitter</a>
              <a href="https://instagram.com" style={{ color: '#ccc', textDecoration: 'none' }}>Instagram</a>
              <a href="https://linkedin.com" style={{ color: '#ccc', textDecoration: 'none' }}>LinkedIn</a></div>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid #555',
          paddingTop: '24px',
          textAlign: 'center',
          color: '#ccc'
        }}>
          <p style={{ color: "WHITE" }} >&copy; {new Date().getFullYear()} CrowdFundIn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
