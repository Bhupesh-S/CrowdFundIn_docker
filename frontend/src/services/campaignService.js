import api from './api';

export const campaignService = {
  async getAllCampaigns(params = {}) {
    const response = await api.get('/campaigns', { params });
    return response.data;
  },

  async getCampaign(id) {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  },

  async createCampaign(formData) {
    const response = await api.post('/campaigns', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateCampaign(id, formData) {
    const response = await api.put(`/campaigns/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteCampaign(id) {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data;
  },

  async getUserCampaigns(userId, params = {}) {
    if (!userId) {
      throw new Error('User ID is required to fetch user campaigns');
    }
    const response = await api.get(`/campaigns/user/${userId}`, { params });
    return response.data;
  }
};
