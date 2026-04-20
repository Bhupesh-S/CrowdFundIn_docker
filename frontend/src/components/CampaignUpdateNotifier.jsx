import React, { useState } from 'react';
import './CampaignUpdateNotifier.css';

const CampaignUpdateNotifier = ({ campaignId, campaignTitle, onUpdateSent }) => {
  const [updateMessage, setUpdateMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!updateMessage.trim()) {
      setError('Please enter an update message');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/campaign-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          campaignId,
          updateMessage: updateMessage.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Update sent successfully to ${data.sent} donor${data.sent !== 1 ? 's' : ''}!`);
        setUpdateMessage('');
        setShowForm(false);
        if (onUpdateSent) {
          onUpdateSent(data);
        }
      } else {
        setError(data.message || 'Failed to send update');
      }
    } catch (error) {
      console.error('Error sending campaign update:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setUpdateMessage('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="campaign-update-notifier">
      {!showForm ? (
        <div className="update-prompt">
          <div className="update-prompt-content">
            <div className="update-icon">
              <i className="fas fa-envelope"></i>
            </div>
            <div className="update-text">
              <h4>Send Update to Donors</h4>
              <p>Keep your supporters informed about your campaign progress</p>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <i className="fas fa-paper-plane"></i>
            Send Update
          </button>
        </div>
      ) : (
        <div className="update-form-container">
          <div className="update-form-header">
            <h4>
              <i className="fas fa-envelope-open-text"></i>
              Send Update to Donors
            </h4>
            <p>This message will be sent to all donors who supported "{campaignTitle}"</p>
          </div>

          <form onSubmit={handleSubmit} className="update-form">
            <div className="form-group">
              <label htmlFor="updateMessage">Update Message</label>
              <textarea
                id="updateMessage"
                className="form-control"
                rows="6"
                placeholder="Share your campaign progress, milestones reached, or any important updates with your supporters..."
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                disabled={loading}
                maxLength={2000}
              />
              <small className="text-muted">
                {updateMessage.length}/2000 characters
              </small>
            </div>

            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !updateMessage.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Update
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="update-info">
            <div className="info-item">
              <i className="fas fa-info-circle"></i>
              <span>Updates are sent via email to all your campaign supporters</span>
            </div>
            <div className="info-item">
              <i className="fas fa-clock"></i>
              <span>Emails are delivered immediately after sending</span>
            </div>
            <div className="info-item">
              <i className="fas fa-shield-alt"></i>
              <span>Donor email addresses remain private and secure</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignUpdateNotifier;