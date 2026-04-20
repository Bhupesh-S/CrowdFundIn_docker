import api from './api';

export const commentService = {
  // Get comments for a campaign
  async getCampaignComments(campaignId, params = {}) {
    const response = await api.get(`/comments/campaign/${campaignId}`, { params });
    return response.data;
  },

  // Add a new comment
  async addComment(commentData) {
    const response = await api.post('/comments', commentData);
    return response.data;
  },

  // Update a comment
  async updateComment(commentId, content) {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },

  // Delete a comment
  async deleteComment(commentId) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  // Like/Unlike a comment
  async likeComment(commentId) {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  // Report a comment
  async reportComment(commentId, reason) {
    const response = await api.post(`/comments/${commentId}/report`, { reason });
    return response.data;
  },

  // Get user's comments
  async getUserComments(userId, params = {}) {
    const response = await api.get(`/comments/user/${userId}`, { params });
    return response.data;
  }
};