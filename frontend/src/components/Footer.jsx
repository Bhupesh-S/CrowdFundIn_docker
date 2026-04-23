import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div>
            <h3 className="footer-logo">
              CrowdFundIn
            </h3>
            <p className="footer-tagline">
              Empowering dreams through community support. Join us in making a difference, 
              one campaign at a time.
            </p>
          </div>
          
          <div>
            <h4 className="footer-col-heading">Quick Links</h4>
            <div className="footer-links-col">
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/campaigns" className="footer-link">Browse Campaigns</Link>
              <Link to="/how-it-works" className="footer-link">How It Works</Link>
              <Link to="/about" className="footer-link">About Us</Link>
            </div>
          </div>
          
          <div>
            <h4 className="footer-col-heading">Support</h4>
            <div className="footer-links-col">
              <Link to="/help" className="footer-link">Help Center</Link>
              <Link to="/contact" className="footer-link">Contact Us</Link>
              <Link to="/privacy" className="footer-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-link">Terms of Service</Link>
            </div>
          </div>
          
          <div>
            <h4 className="footer-col-heading">Follow Us</h4>
            <div className="footer-links-col">
              <a href="https://facebook.com" className="footer-link" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://twitter.com" className="footer-link" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://instagram.com" className="footer-link" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://linkedin.com" className="footer-link" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} CrowdFundIn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
