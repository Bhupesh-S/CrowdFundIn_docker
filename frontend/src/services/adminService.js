import api from './api';

export const adminService = {
  // Dashboard stats
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // User management
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  async verifyUser(userId, isVerified, rejectionReason = null) {
    const response = await api.put(`/admin/users/${userId}/verify`, {
      isVerified,
      rejectionReason
    });
    return response.data;
  },

  async getUnverifiedDonors(params = {}) {
    const response = await api.get('/admin/donors/unverified', { params });
    return response.data;
  },

  // Campaign management
  async getCampaigns(params = {}) {
    const response = await api.get('/admin/campaigns', { params });
    return response.data;
  },

  async updateCampaignStatus(campaignId, status) {
    const response = await api.put(`/admin/campaigns/${campaignId}/status`, { status });
    return response.data;
  },

  async verifyCampaign(campaignId, isVerified, rejectionReason = null) {
    const response = await api.put(`/admin/campaigns/${campaignId}/verify`, {
      isVerified,
      rejectionReason
    });
    return response.data;
  },

  async getUnverifiedCampaigns(params = {}) {
    const response = await api.get('/admin/campaigns/unverified', { params });
    return response.data;
  },

  // Complaint management
  async getComplaints(params = {}) {
    const response = await api.get('/admin/complaints', { params });
    return response.data;
  },

  async updateComplaint(complaintId, data) {
    const response = await api.put(`/admin/complaints/${complaintId}`, data);
    return response.data;
  },

  // Donor history
  async getDonorHistory(params = {}) {
    const response = await api.get('/admin/donor-history', { params });
    return response.data;
  },

  // Reports (alias for complaints)
  async getReports(params = {}) {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  }
};
