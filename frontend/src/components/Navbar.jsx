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
    <nav style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e1e5e9', 
      zIndex: 1000,
      height: '70px'
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '100%'
      }}>
        <Link 
          to="/" 
          style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#667eea', 
            textDecoration: 'none' 
          }}
        >
          CrowdFundIn
        </Link>

        {/* Desktop Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="desktop-menu">
          <Link 
            to="/" 
            style={{ 
              textDecoration: 'none', 
              color: '#333', 
              fontWeight: '500',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#667eea'}
            onMouseLeave={(e) => e.target.style.color = '#333'}
          >
            Home
          </Link>
          <Link 
            to="/campaigns" 
            style={{ 
              textDecoration: 'none', 
              color: '#333', 
              fontWeight: '500',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#667eea'}
            onMouseLeave={(e) => e.target.style.color = '#333'}
          >
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
                <Link to="/my-donations" style={{ 
                  textDecoration: 'none', 
                  color: '#333', 
                  fontWeight: '500',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#667eea'}
                onMouseLeave={(e) => e.target.style.color = '#333'}>
                  My Donations
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" style={{ 
                  textDecoration: 'none', 
                  color: '#333', 
                  fontWeight: '500',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#667eea'}
                onMouseLeave={(e) => e.target.style.color = '#333'}>
                  Admin
                </Link>
              )}
              
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <div 
                  className="avatar" 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {getAvatarInitial()}
                </div>
                
                {isMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '8px 0',
                    minWidth: '180px',
                    marginTop: '8px'
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e1e5e9' }}>
                      <div style={{ fontWeight: '600', color: '#333' }}>{user?.name}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>{user?.email}</div>
                    </div>
                    <Link 
                      to="/profile" 
                      style={{ 
                        display: 'block',
                        padding: '12px 16px',
                        textDecoration: 'none',
                        color: '#333',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: 'transparent',
                        color: '#dc3545',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" className="btn minimal-btn btn-small" style={{background: '#f5f6fa', color: '#2c3e50', border: '1px solid #e1e5e9', borderRadius: '8px', boxShadow: 'none'}}>Login</Link>
              <Link to="/register" className="btn minimal-btn btn-small" style={{background: '#2c3e50', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: 'none'}}>Sign Up</Link>
              
              {/* Admin Access Dropdown */}
              <div style={{ position: 'relative' }} ref={adminDropdownRef}>
                <button 
                  className="btn minimal-btn btn-small"
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                  style={{
                    background: '#dc3545', 
                    color: '#fff', 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '8px 12px'
                  }}
                >
                  Admin
                </button>
                
                {isAdminDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '8px 0',
                    minWidth: '160px',
                    marginTop: '8px',
                    zIndex: 1001
                  }}>
                    <Link 
                      to="/admin/login" 
                      style={{ 
                        display: 'block',
                        padding: '12px 16px',
                        textDecoration: 'none',
                        color: '#333',
                        transition: 'background-color 0.2s ease',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      onClick={() => setIsAdminDropdownOpen(false)}
                    >
                      Admin Login
                    </Link>
                    <Link 
                      to="/admin/signup" 
                      style={{ 
                        display: 'block',
                        padding: '12px 16px',
                        textDecoration: 'none',
                        color: '#333',
                        transition: 'background-color 0.2s ease',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      onClick={() => setIsAdminDropdownOpen(false)}
                    >
                      Admin Signup
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            className="mobile-menu"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderBottom: '1px solid #e1e5e9',
              padding: '20px',
              display: 'none'
            }}
          >
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
                  
                  <div style={{ borderTop: '1px solid #e1e5e9', paddingTop: '12px', marginTop: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc3545', marginBottom: '8px' }}>
                      🔐 Admin Access
                    </div>
                    <Link 
                      to="/admin/login" 
                      className="btn btn-outline"
                      style={{ 
                        marginBottom: '8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: '1px solid #dc3545'
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      🔑 Admin Login
                    </Link>
                    <Link 
                      to="/admin/signup" 
                      className="btn btn-outline"
                      style={{ 
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: '1px solid #6c757d'
                      }}
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
