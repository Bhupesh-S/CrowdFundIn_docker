import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: '📊'
    },
    {
      path: '/admin/users',
      label: 'Users',
      icon: '👥'
    },
    {
      path: '/admin/campaigns',
      label: 'Campaigns',
      icon: '🎯'
    },
    {
      path: '/admin/reports',
      label: 'Reports',
      icon: '📋'
    },
    {
      path: '/admin/verify-donors',
      label: 'Verify Donors',
      icon: '🔍'
    },
    {
      path: '/admin/verify-campaigns',
      label: 'Verify Campaigns',
      icon: '✅'
    },
    {
      path: '/admin/complaints',
      label: 'Complaints',
      icon: '⚠️'
    },
    {
      path: '/admin/donor-history',
      label: 'Donor History',
      icon: '💰'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      {/* Top Navigation */}
      <header className="admin-navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <Link to="/admin/dashboard" className="admin-brand">
              <span className="brand-icon">🏛️</span>
              <span className="brand-text">Admin Panel</span>
            </Link>
          </div>
          
          <nav className="navbar-nav">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
          
          <div className="navbar-right">
            <Link to="/" className="view-site-btn">
              🌐 View Site
            </Link>
            <div className="admin-info">
              <span className="admin-name">{user?.name}</span>
              <span className="admin-badge">Admin</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
