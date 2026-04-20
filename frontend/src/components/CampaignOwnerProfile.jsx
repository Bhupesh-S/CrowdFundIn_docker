import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import EditProfileForm from './EditProfileForm';
import './CampaignOwnerProfile.css';

const CampaignOwnerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/campaigns/profile?' + Date.now(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      console.log('Fetched profile data:', data);
      console.log('Profile picture path:', data.data?.profilePicture);
      setProfile(data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (formData, isFormData = false) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('Updating profile with FormData:', isFormData);
      console.log('FormData type:', typeof formData);
      
      // Prepare headers and body based on data type
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      let body;
      if (isFormData) {
        // Don't set Content-Type for FormData, let browser set it with boundary
        body = formData;
        console.log('Using FormData for request');
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(formData);
        console.log('Using JSON for request');
      }
      
      console.log('Sending request to:', 'http://localhost:5000/api/campaigns/profile/update');
      
      const response = await fetch('http://localhost:5000/api/campaigns/profile/update', {
        method: 'PUT',
        headers,
        body
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('Success response:', data);
      setProfile(data.data);
      setIsEditing(false);
      
      // Refresh profile data to ensure we have the latest
      await fetchProfile();
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error; // Re-throw to let EditProfileForm handle it
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="mb-0">Campaign Owner Profile</h3>
        </div>
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="mb-0">Campaign Owner Profile</h3>
        </div>
        <div className="card-body text-center">
          <div className="text-danger mb-3">
            <i className="fas fa-exclamation-triangle fa-2x"></i>
          </div>
          <p className="text-danger">{error}</p>
          <button 
            onClick={fetchProfile}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">Edit Profile</h3>
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-outline btn-small"
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="card-body">
          <EditProfileForm
            initialData={profile}
            onSave={handleUpdateProfile}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Campaign Owner Profile</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary btn-small"
          >
            <i className="fas fa-edit me-2"></i>
            Edit Profile
          </button>
        </div>
      </div>
      
      <div className="card-body">
        <div className="row">
          {/* Profile Picture Section */}
          <div className="col-md-3 text-center mb-4">
            <div className="profile-picture-container">
              {(() => {
                console.log('Rendering profile picture, path:', profile?.profilePicture);
                const imageSrc = profile?.profilePicture ? `http://localhost:5000${profile.profilePicture}` : null;
                console.log('Full image URL:', imageSrc);
                return profile?.profilePicture ? (
                  <img
                    src={imageSrc}
                    alt="Profile"
                    className="rounded-circle"
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      border: '3px solid #e1e5e9'
                    }}
                    onLoad={() => console.log('Image loaded successfully:', imageSrc)}
                    onError={(e) => {
                      console.log('Image failed to load:', imageSrc);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null;
              })()}
              <div
                className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '120px',
                  height: '120px',
                  border: '3px solid #e1e5e9',
                  display: profile?.profilePicture ? 'none' : 'flex'
                }}
              >
                <i className="fas fa-user fa-3x text-muted"></i>
              </div>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="col-md-9">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label font-weight-bold">Name</label>
                <p className="form-control-plaintext border p-2 rounded bg-light">
                  {profile?.name || 'Not provided'}
                </p>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label font-weight-bold">Email</label>
                <p className="form-control-plaintext border p-2 rounded bg-light">
                  {profile?.email || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label font-weight-bold">Bio</label>
              <div className="border p-3 rounded bg-light" style={{ minHeight: '80px' }}>
                {profile?.bio ? (
                  <p className="mb-0">{profile.bio}</p>
                ) : (
                  <p className="text-muted mb-0">No bio provided</p>
                )}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label font-weight-bold">Website</label>
                <div className="border p-2 rounded bg-light">
                  {profile?.website ? (
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-decoration-none"
                    >
                      <i className="fas fa-external-link-alt me-2"></i>
                      {profile.website}
                    </a>
                  ) : (
                    <span className="text-muted">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="mb-3">
              <label className="form-label font-weight-bold">Social Media</label>
              <div className="row">
                <div className="col-md-4 mb-2">
                  <div className="border p-2 rounded bg-light">
                    <div className="d-flex align-items-center">
                      <i className="fab fa-twitter text-info me-2"></i>
                      {profile?.socialMedia?.twitter ? (
                        <a 
                          href={`https://twitter.com/${profile.socialMedia.twitter.replace('@', '')}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none"
                        >
                          @{profile.socialMedia.twitter.replace('@', '')}
                        </a>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4 mb-2">
                  <div className="border p-2 rounded bg-light">
                    <div className="d-flex align-items-center">
                      <i className="fab fa-linkedin text-primary me-2"></i>
                      {profile?.socialMedia?.linkedin ? (
                        <a 
                          href={profile.socialMedia.linkedin.startsWith('http') ? profile.socialMedia.linkedin : `https://linkedin.com/in/${profile.socialMedia.linkedin}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none"
                        >
                          LinkedIn
                        </a>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4 mb-2">
                  <div className="border p-2 rounded bg-light">
                    <div className="d-flex align-items-center">
                      <i className="fab fa-instagram text-danger me-2"></i>
                      {profile?.socialMedia?.instagram ? (
                        <a 
                          href={`https://instagram.com/${profile.socialMedia.instagram.replace('@', '')}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none"
                        >
                          @{profile.socialMedia.instagram.replace('@', '')}
                        </a>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignOwnerProfile;