import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Target, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { adminService } from '../services/adminService.js';
import toast from 'react-hot-toast';
import AdminLayoutProfessional from '../components/AdminLayoutProfessional.jsx';
import './AdminDashboardProfessional.css';

const AdminDashboardProfessional = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [statsData, usersData, campaignsData, reportsData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
        adminService.getCampaigns({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
        adminService.getReports({ limit: 5, sortBy: 'createdAt', order: 'desc' })
      ]);

      setStats(statsData);
      setRecentUsers(usersData.users || []);
      setRecentCampaigns(campaignsData.campaigns || []);
      setRecentReports(reportsData.reports || []);
    } catch (error) {
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'status-success',
      pending: 'status-warning',
      completed: 'status-info',
      rejected: 'status-error',
      dismissed: 'status-error',
      resolved: 'status-success'
    };
    return colors[status] || 'status-default';
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'card-blue',
      trend: '+12% from last month',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Active Campaigns',
      value: stats?.campaignsByStatus?.find(c => c._id === 'active')?.count || 0,
      icon: Target,
      color: 'card-green',
      trend: '+8% from last month',
      onClick: () => navigate('/admin/campaigns')
    },
    {
      title: 'Pending Approvals',
      value: (stats?.pendingDonors || 0) + (stats?.pendingCampaigns || 0),
      icon: Clock,
      color: 'card-orange',
      trend: 'Requires attention',
      onClick: () => navigate('/admin/verify-donors')
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalAmountRaised),
      icon: DollarSign,
      color: 'card-purple',
      trend: '+15% from last month',
      isMonetary: true
    }
  ];

  if (loading) {
    return (
      <AdminLayoutProfessional>
        <div className="dashboard-loading">
          <div className="loading-spinner">
            <RefreshCw className="animate-spin" size={32} />
          </div>
          <p>Loading dashboard...</p>
        </div>
      </AdminLayoutProfessional>
    );
  }

  if (error) {
    return (
      <AdminLayoutProfessional>
        <div className="dashboard-error">
          <AlertTriangle size={48} className="error-icon" />
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </AdminLayoutProfessional>
    );
  }

  return (
    <AdminLayoutProfessional>
      <div className="dashboard-professional">
        {/* Stats Cards */}
        <div className="stats-grid">
          {statsCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div 
                key={index} 
                className={`stat-card ${card.color} ${card.onClick ? 'clickable' : ''}`}
                onClick={card.onClick}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="stat-card-content">
                  <div className="stat-info">
                    <h3 className="stat-title">{card.title}</h3>
                    <p className="stat-value">{card.value}</p>
                    <span className="stat-trend">{card.trend}</span>
                  </div>
                  <div className="stat-icon">
                    <IconComponent size={24} />
                  </div>
                </div>
                {card.onClick && (
                  <div className="stat-card-action">
                    <ArrowUpRight size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Recent Users */}
          <div className="content-card" style={{ animationDelay: '0.4s' }}>
            <div className="card-header">
              <div className="card-title">
                <Users size={20} />
                <h3>Recent Users</h3>
              </div>
              <button 
                onClick={() => navigate('/admin/users')}
                className="view-all-btn"
              >
                <Eye size={16} />
                View All
              </button>
            </div>
            <div className="card-content">
              {recentUsers.length === 0 ? (
                <div className="empty-state">
                  <p>No recent users</p>
                </div>
              ) : (
                <div className="list-items">
                  {recentUsers.map((user) => (
                    <div key={user._id} className="list-item">
                      <div className="item-avatar">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="item-info">
                        <div className="item-name">{user.name}</div>
                        <div className="item-meta">{user.email}</div>
                      </div>
                      <div className="item-badges">
                        <span className={`badge ${user.role}`}>{user.role}</span>
                        {user.isVerified && (
                          <CheckCircle size={14} className="verified-icon" />
                        )}
                      </div>
                      <div className="item-date">{formatDate(user.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="content-card" style={{ animationDelay: '0.5s' }}>
            <div className="card-header">
              <div className="card-title">
                <Target size={20} />
                <h3>Recent Campaigns</h3>
              </div>
              <button 
                onClick={() => navigate('/admin/campaigns')}
                className="view-all-btn"
              >
                <Eye size={16} />
                View All
              </button>
            </div>
            <div className="card-content">
              {recentCampaigns.length === 0 ? (
                <div className="empty-state">
                  <p>No recent campaigns</p>
                </div>
              ) : (
                <div className="list-items">
                  {recentCampaigns.map((campaign) => (
                    <div key={campaign._id} className="list-item">
                      <div className="item-avatar campaign-avatar">
                        {campaign.image ? (
                          <img src={campaign.image} alt={campaign.title} />
                        ) : (
                          <Target size={16} />
                        )}
                      </div>
                      <div className="item-info">
                        <div className="item-name">{campaign.title}</div>
                        <div className="item-meta">
                          Goal: {formatCurrency(campaign.goalAmount)}
                        </div>
                      </div>
                      <div className="item-badges">
                        <span className={`status-badge ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="item-date">{formatDate(campaign.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="content-card full-width" style={{ animationDelay: '0.6s' }}>
            <div className="card-header">
              <div className="card-title">
                <FileText size={20} />
                <h3>Recent Reports</h3>
              </div>
              <button 
                onClick={() => navigate('/admin/reports')}
                className="view-all-btn"
              >
                <Eye size={16} />
                View All
              </button>
            </div>
            <div className="card-content">
              {recentReports.length === 0 ? (
                <div className="empty-state">
                  <p>No recent reports</p>
                </div>
              ) : (
                <div className="list-items">
                  {recentReports.map((report) => (
                    <div key={report._id} className="list-item">
                      <div className="item-avatar report-avatar">
                        <FileText size={16} />
                      </div>
                      <div className="item-info">
                        <div className="item-name">{report.subject}</div>
                        <div className="item-meta">
                          By: {report.user?.name || 'Unknown'} • 
                          Campaign: {report.campaign?.title || 'Unknown'}
                        </div>
                      </div>
                      <div className="item-badges">
                        <span className={`status-badge ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="item-date">{formatDate(report.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="overview-section">
          <h3 className="section-title">System Overview</h3>
          <div className="overview-grid">
            <div className="overview-card" style={{ animationDelay: '0.7s' }}>
              <div className="overview-header">
                <h4>User Distribution</h4>
                <TrendingUp size={16} />
              </div>
              <div className="overview-content">
                {stats?.usersByRole?.map(item => (
                  <div key={item._id} className="overview-item">
                    <span className="overview-label">
                      {item._id === 'campaign_owner' ? 'Campaign Owners' : 
                       item._id.charAt(0).toUpperCase() + item._id.slice(1) + 's'}
                    </span>
                    <span className="overview-value">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-card" style={{ animationDelay: '0.8s' }}>
              <div className="overview-header">
                <h4>Campaign Status</h4>
                <Target size={16} />
              </div>
              <div className="overview-content">
                {stats?.campaignsByStatus?.map(item => (
                  <div key={item._id} className="overview-item">
                    <span className="overview-label">
                      {item._id.charAt(0).toUpperCase() + item._id.slice(1)}
                    </span>
                    <span className="overview-value">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-card" style={{ animationDelay: '0.9s' }}>
              <div className="overview-header">
                <h4>Financial Summary</h4>
                <DollarSign size={16} />
              </div>
              <div className="overview-content">
                <div className="overview-item">
                  <span className="overview-label">Total Donations</span>
                  <span className="overview-value">{stats?.totalDonations || 0}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Amount Raised</span>
                  <span className="overview-value">{formatCurrency(stats?.totalAmountRaised)}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Avg. Donation</span>
                  <span className="overview-value">
                    {stats?.totalDonations ? 
                      formatCurrency(stats.totalAmountRaised / stats.totalDonations) : '$0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutProfessional>
  );
};

export default AdminDashboardProfessional;
