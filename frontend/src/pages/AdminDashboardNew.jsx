import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout.jsx';
import './AdminPages.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    checkHealthStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkHealthStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      setHealthStatus({ status: 'error', error: 'API unreachable' });
      console.error('Health check error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    return status === 'ok' ? '#28a745' : '#dc3545';
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="retry-btn" onClick={fetchDashboardData}>
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Dashboard Overview</h1>
            <p className="page-description">Welcome to the CrowdFundIn Admin Panel</p>
          </div>
          <div className="header-actions">
            <div className="health-status">
              <span className="health-label">API Status:</span>
              <span 
                className="health-indicator"
                style={{ 
                  color: getStatusColor(healthStatus?.status),
                  fontWeight: '600'
                }}
              >
                {healthStatus?.status === 'ok' ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card primary">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <div className="metric-number">{stats?.totalUsers || 0}</div>
                  <div className="metric-label">Total Users</div>
                </div>
                <div className="metric-action">
                  <button 
                    onClick={() => navigate('/admin/users')}
                    className="metric-btn"
                  >
                    Manage →
                  </button>
                </div>
              </div>

              <div className="metric-card secondary">
                <div className="metric-icon">🎯</div>
                <div className="metric-content">
                  <div className="metric-number">{stats?.totalCampaigns || 0}</div>
                  <div className="metric-label">Total Campaigns</div>
                </div>
                <div className="metric-action">
                  <button 
                    onClick={() => navigate('/admin/campaigns')}
                    className="metric-btn"
                  >
                    Manage →
                  </button>
                </div>
              </div>

              <div className="metric-card success">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <div className="metric-number">{stats?.totalDonations || 0}</div>
                  <div className="metric-label">Total Donations</div>
                </div>
                <div className="metric-action">
                  <button 
                    onClick={() => navigate('/admin/donor-history')}
                    className="metric-btn"
                  >
                    View →
                  </button>
                </div>
              </div>

              <div className="metric-card warning">
                <div className="metric-icon">💵</div>
                <div className="metric-content">
                  <div className="metric-number">{formatCurrency(stats?.totalAmountRaised)}</div>
                  <div className="metric-label">Amount Raised</div>
                </div>
                <div className="metric-action">
                  <span className="metric-trend">+12% this month</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions-grid">
                <div 
                  className="quick-action-card verification"
                  onClick={() => navigate('/admin/verify-donors')}
                >
                  <div className="action-icon">🔍</div>
                  <div className="action-content">
                    <h3>Verify Donors</h3>
                    <p>Review and approve donor accounts</p>
                    <div className="action-badge">
                      {stats?.pendingDonors || 0} pending
                    </div>
                  </div>
                </div>

                <div 
                  className="quick-action-card verification"
                  onClick={() => navigate('/admin/verify-campaigns')}
                >
                  <div className="action-icon">✅</div>
                  <div className="action-content">
                    <h3>Verify Campaigns</h3>
                    <p>Review and approve campaigns</p>
                    <div className="action-badge">
                      {stats?.pendingCampaigns || 0} pending
                    </div>
                  </div>
                </div>

                <div 
                  className="quick-action-card reports"
                  onClick={() => navigate('/admin/reports')}
                >
                  <div className="action-icon">📋</div>
                  <div className="action-content">
                    <h3>Handle Reports</h3>
                    <p>Review user complaints and reports</p>
                    <div className="action-badge">
                      {stats?.openComplaints || 0} open
                    </div>
                  </div>
                </div>

                <div 
                  className="quick-action-card complaints"
                  onClick={() => navigate('/admin/complaints')}
                >
                  <div className="action-icon">⚠️</div>
                  <div className="action-content">
                    <h3>Manage Complaints</h3>
                    <p>Handle detailed complaint management</p>
                    <div className="action-badge">Active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Overview */}
            <div className="statistics-section">
              <div className="stats-grid">
                {/* User Statistics */}
                <div className="stats-card">
                  <div className="stats-header">
                    <h3>User Statistics</h3>
                    <span className="stats-icon">👥</span>
                  </div>
                  <div className="stats-content">
                    {stats?.usersByRole?.map(item => (
                      <div key={item._id} className="stats-item">
                        <span className="stats-label">
                          {item._id === 'campaign_owner' ? 'Campaign Owners' : 
                           item._id.charAt(0).toUpperCase() + item._id.slice(1) + 's'}:
                        </span>
                        <span className="stats-value">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaign Statistics */}
                <div className="stats-card">
                  <div className="stats-header">
                    <h3>Campaign Statistics</h3>
                    <span className="stats-icon">🎯</span>
                  </div>
                  <div className="stats-content">
                    {stats?.campaignsByStatus?.map(item => (
                      <div key={item._id} className="stats-item">
                        <span className="stats-label">
                          {item._id.charAt(0).toUpperCase() + item._id.slice(1)}:
                        </span>
                        <span className="stats-value">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="stats-card">
                  <div className="stats-header">
                    <h3>Financial Overview</h3>
                    <span className="stats-icon">💰</span>
                  </div>
                  <div className="stats-content">
                    <div className="stats-item">
                      <span className="stats-label">Success Rate:</span>
                      <span className="stats-value">
                        {stats?.totalCampaigns ? 
                          Math.round((stats.completedCampaigns / stats.totalCampaigns) * 100) : 0}%
                      </span>
                    </div>
                    <div className="stats-item">
                      <span className="stats-label">Avg Donation:</span>
                      <span className="stats-value">
                        {stats?.totalDonations ? 
                          formatCurrency(stats.totalAmountRaised / stats.totalDonations) : '$0'}
                      </span>
                    </div>
                    <div className="stats-item">
                      <span className="stats-label">Total Donors:</span>
                      <span className="stats-value">{stats?.totalDonors || 0}</span>
                    </div>
                  </div>
                </div>

                {/* System Status */}
                <div className="stats-card">
                  <div className="stats-header">
                    <h3>System Status</h3>
                    <span className="stats-icon">⚙️</span>
                  </div>
                  <div className="stats-content">
                    <div className="system-status-item">
                      <div className="status-indicator online"></div>
                      <span>Database: Online</span>
                    </div>
                    <div className="system-status-item">
                      <div className="status-indicator online"></div>
                      <span>API: {healthStatus?.status === 'ok' ? 'Online' : 'Offline'}</span>
                    </div>
                    <div className="system-status-item">
                      <div className="status-indicator online"></div>
                      <span>File Storage: Available</span>
                    </div>
                    <div className="system-status-item">
                      <div className="status-indicator online"></div>
                      <span>Payment Gateway: Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {stats?.monthlySignups && stats.monthlySignups.length > 0 && (
              <div className="activity-section">
                <h2 className="section-title">Recent Activity</h2>
                <div className="activity-card">
                  <h3>Monthly Signups (Last 6 Months)</h3>
                  <div className="activity-chart">
                    {stats.monthlySignups.slice(-6).map((item, index) => {
                      const maxCount = Math.max(...stats.monthlySignups.map(s => s.count));
                      const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={index} className="chart-bar">
                          <div 
                            className="bar-fill"
                            style={{ height: `${height}%` }}
                          ></div>
                          <div className="bar-value">{item.count}</div>
                          <div className="bar-label">
                            {item._id.month}/{item._id.year}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
