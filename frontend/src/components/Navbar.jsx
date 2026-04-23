import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAuthenticated, isDonor, isCampaignOwner, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const adminDropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setIsAdminDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const getAvatarInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '100%'
      }}>
        <Link to="/" className="navbar-brand-logo">
          CrowdFundIn
        </Link>

        {/* Desktop Menu */}
        <div className="desktop-menu">
          <Link to="/" className="nav-link-custom">
            Home
          </Link>
          <Link to="/campaigns" className="nav-link-custom">
            Campaigns
          </Link>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {isCampaignOwner && (
                <Link to="/dashboard" className="btn btn-primary btn-small">
                  Dashboard
                </Link>
              )}
              {isDonor && (
                <Link to="/my-donations" className="nav-link-custom">
                  My Donations
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="nav-link-custom">
                  Admin
                </Link>
              )}
              
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <div 
                  className="avatar user-avatar-custom" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {getAvatarInitial()}
                </div>
                
                  <div className={`user-menu-dropdown ${isMenuOpen ? 'show' : ''}`}>
                    <div className="dropdown-header">
                      <div className="dropdown-user-name">{user?.name}</div>
                      <div className="dropdown-user-email">{user?.email}</div>
                    </div>
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item danger"
                    >
                      Logout
                    </button>
                  </div>
              </div>
            </div>

          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
              
              {/* Admin Access Dropdown */}
              <div style={{ position: 'relative' }} ref={adminDropdownRef}>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                >
                  Admin
                </button>
                
                <div className={`user-menu-dropdown ${isAdminDropdownOpen ? 'show' : ''}`}>
                  <Link 
                    to="/admin/login" 
                    className="dropdown-item"
                    onClick={() => setIsAdminDropdownOpen(false)}
                  >
                    Admin Login
                  </Link>
                  <Link 
                    to="/admin/signup" 
                    className="dropdown-item"
                    onClick={() => setIsAdminDropdownOpen(false)}
                  >
                    Admin Signup
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu active">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/campaigns" onClick={() => setIsMenuOpen(false)}>Campaigns</Link>
              
              {isAuthenticated ? (
                <>
                  {isCampaignOwner && <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>}
                  {isDonor && <Link to="/my-donations" onClick={() => setIsMenuOpen(false)}>My Donations</Link>}
                  {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin</Link>}
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>Profile Settings</Link>
                  <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link to="/login" className="btn btn-outline" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                  
                  <div className="dropdown-divider mt-2 mb-2"></div>
                  <div>
                    <div className="dropdown-header text-danger mb-2">
                      🔐 Admin Access
                    </div>
                    <Link 
                      to="/admin/login" 
                      className="btn btn-outline mb-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      🔑 Admin Login
                    </Link>
                    <Link 
                      to="/admin/signup" 
                      className="btn btn-outline"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      👑 Admin Signup
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      <style>
        {`
          @media (max-width: 768px) {
            .desktop-menu { display: none !important; }
            .mobile-menu-button { display: block !important; }
            .mobile-menu { display: block !important; }
          }
        `}
      </style>
    </nav>
  );
};

export default Navbar;
