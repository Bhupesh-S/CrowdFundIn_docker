import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './CreateCampaign.css';
import { campaignService } from '../services/campaignService';
import { isImageFile, createImagePreview } from '../utils/helpers';

const CATEGORIES = [
  'Education', 
  'Healthcare', 
  'Environment', 
  'Technology', 
  'Arts', 
  'Community', 
  'Emergency', 
  'Other'
];

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get campaign ID for edit mode
  const isEditMode = Boolean(id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    deadline: '',
    category: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const loadCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await campaignService.getCampaign(id);
      const campaign = response.campaign || response;
      
      // Format date for input field (YYYY-MM-DD)
      const formattedDeadline = new Date(campaign.deadline).toISOString().split('T')[0];
      
      setFormData({
        title: campaign.title || '',
        description: campaign.description || '',
        goalAmount: campaign.goalAmount?.toString() || '',
        deadline: formattedDeadline,
        category: campaign.category || ''
      });

      // If there's an existing image, set preview
      if (campaign.image) {
        setImagePreview(`http://localhost:5000${campaign.image}`);
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
      alert('Failed to load campaign data');
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Load campaign data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadCampaignData();
    }
  }, [id, isEditMode, loadCampaignData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setSelectedFile(null);
      setImagePreview(null);
      return;
    }

    if (!isImageFile(file)) {
      setErrors(prev => ({
        ...prev,
        image: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({
        ...prev,
        image: 'Image file size must be less than 5MB'
      }));
      return;
    }

    setSelectedFile(file);
    setImagePreview(createImagePreview(file));
    
    if (errors.image) {
      setErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Campaign description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.goalAmount) {
      newErrors.goalAmount = 'Goal amount is required';
    } else if (parseFloat(formData.goalAmount) <= 0) {
      newErrors.goalAmount = 'Goal amount must be greater than 0';
    } else if (parseFloat(formData.goalAmount) > 1000000) {
      newErrors.goalAmount = 'Goal amount cannot exceed $1,000,000';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Campaign deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 1); // Tomorrow
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 365); // 1 year from now

      if (deadlineDate < minDate) {
        newErrors.deadline = 'Deadline must be at least 1 day from now';
      } else if (deadlineDate > maxDate) {
        newErrors.deadline = 'Deadline cannot be more than 1 year from now';
      }
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Create campaign form submitted.');
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    console.log('Form validated successfully. Setting loading state.');
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('goalAmount', parseFloat(formData.goalAmount));
      
      // Convert deadline to ISO format
      const deadlineISO = new Date(formData.deadline + 'T23:59:59').toISOString();
      submitData.append('deadline', deadlineISO);
      
      submitData.append('category', formData.category);
      
      if (selectedFile) {
        submitData.append('image', selectedFile);
      }

      console.log('Sending data to the backend...', Object.fromEntries(submitData.entries()));
      
      let response;
      if (isEditMode) {
        response = await campaignService.updateCampaign(id, submitData);
        console.log('Backend update response received:', response);
        alert('Campaign updated successfully!');
        navigate(`/campaigns/${id}`);
      } else {
        response = await campaignService.createCampaign(submitData);
        console.log('Backend create response received:', response);
        
        // Check if the response is successful and contains campaign data
        if (response && (response.campaign || response._id || response.id)) {
          alert('Campaign created successfully!');
          
          // Extract campaign ID from the response
          const campaignId = response.campaign?._id || response.campaign?.id || response._id || response.id;
          console.log('Extracted campaign ID:', campaignId);
          
          if (campaignId) {
            navigate(`/campaigns/${campaignId}`);
          } else {
            console.error('No campaign ID found in response:', response);
            navigate('/campaigns'); // Fallback to campaigns list
          }
        } else {
          throw new Error('Invalid response from server');
        }
      }

    } catch (err) {
      console.error('An error occurred while creating the campaign:', err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Backend Error Data:', err.response.data);
        console.error('Backend Error Status:', err.response.status);
        console.error('Backend Error Headers:', err.response.headers);
        
        // Log specific validation errors
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          console.error('Specific validation errors:', err.response.data.errors);
          err.response.data.errors.forEach((error, index) => {
            console.error(`Validation error ${index + 1}:`, error);
          });
        }
        
        setErrors(err.response.data.errors || {});
        alert(`Error: ${err.response.data.message || 'An error occurred.'}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response from server. Is the backend running?');
        alert('Could not connect to the server. Please ensure the backend is running and accessible.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up the request:', err.message);
        alert(`An error occurred: ${err.message}`);
      }
    } finally {
      console.log('Finished create campaign attempt. Resetting loading state.');
      setLoading(false);
    }
  };

  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Set maximum date to 1 year from now
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 365);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <h1 className="mb-4">{isEditMode ? 'Edit Campaign' : 'Create New Campaign'}</h1>
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Campaign Title */}
            <div className="form-group">
              <label className="form-label">Campaign Title *</label>
              <input
                type="text"
                name="title"
                className={`form-control ${errors.title ? 'error' : ''}`}
                placeholder="Enter a compelling title for your campaign"
                value={formData.title}
                onChange={handleInputChange}
                maxLength="100"
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
              <small className="text-muted">
                {formData.title.length}/100 characters
              </small>
            </div>

            {/* Campaign Description */}
            <div className="form-group">
              <label className="form-label">Campaign Description *</label>
              <textarea
                name="description"
                className={`form-control ${errors.description ? 'error' : ''}`}
                placeholder="Tell people about your campaign. What are you raising money for? How will you use the funds?"
                value={formData.description}
                onChange={handleInputChange}
                rows="8"
                style={{ minHeight: '200px' }}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
              <small className="text-muted">
                {formData.description.length} characters (minimum 50)
              </small>
            </div>

            {/* Goal Amount */}
            <div className="form-group">
              <label className="form-label">Funding Goal ($) *</label>
              <input
                type="number"
                name="goalAmount"
                className={`form-control ${errors.goalAmount ? 'error' : ''}`}
                placeholder="10000"
                value={formData.goalAmount}
                onChange={handleInputChange}
                min="1"
                max="1000000"
                step="0.01"
              />
              {errors.goalAmount && <div className="form-error">{errors.goalAmount}</div>}
              <small className="text-muted">
                How much money do you need to raise? (Maximum: $1,000,000)
              </small>
            </div>

            {/* Campaign Deadline */}
            <div className="form-group">
              <label className="form-label">Campaign Deadline *</label>
              <input
                type="date"
                name="deadline"
                className={`form-control ${errors.deadline ? 'error' : ''}`}
                value={formData.deadline}
                onChange={handleInputChange}
                min={minDate}
                max={maxDateString}
              />
              {errors.deadline && <div className="form-error">{errors.deadline}</div>}
              <small className="text-muted">
                When should your campaign end? (1 day - 1 year from now)
              </small>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className={`form-control ${errors.category ? 'error' : ''}`}
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <div className="form-error">{errors.category}</div>}
            </div>

            {/* Campaign Image */}
            <div className="form-group">
              <label className="form-label">Campaign Image</label>
              
              {!imagePreview ? (
                <div 
                  className="image-upload-area"
                  style={{
                    border: '2px dashed #e1e5e9',
                    borderRadius: '8px',
                    padding: '40px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.3s ease'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e1e5e9';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#e1e5e9';
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      fileInputRef.current.files = files;
                      handleFileChange({ target: { files } });
                    }
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ccc' }}>
                  
                  </div>
                  <p className="mb-2">Click to upload or drag and drop</p>
                  <small className="text-muted">
                    PNG, JPG, GIF, WebP up to 5MB
                  </small>
                </div>
              ) : (
                <div className="image-preview" style={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="Campaign preview"
                    style={{
                      width: '100%',
                      height: '300px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={removeImage}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              
              {errors.image && <div className="form-error">{errors.image}</div>}
              <small className="text-muted">
                Add an image to make your campaign more appealing to backers
              </small>
            </div>

            {/* Submit Buttons */}
            <div className="d-flex gap-3 mt-4">
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{
                      width: '16px',
                      height: '16px',
                      marginRight: '8px',
                      borderWidth: '2px'
                    }}></span>
                    Creating Campaign...
                  </>
                ) : (
                  loading ? 'Processing...' : (isEditMode ? 'Update Campaign' : 'Create Campaign')
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/campaigns')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tips Section */}
      <div className="card mt-4">
        <div className="card-header">
          <h3>Tips for a successful campaign</h3>
        </div>
        <div className="card-body">
          <ul style={{ paddingLeft: '20px' }}>
            <li className="mb-2">
              <strong>Clear and compelling title:</strong> Make it obvious what you're raising money for
            </li>
            <li className="mb-2">
              <strong>Detailed description:</strong> Explain your project, timeline, and how funds will be used
            </li>
            <li className="mb-2">
              <strong>Realistic goal:</strong> Set a funding goal that covers your actual needs
            </li>
            <li className="mb-2">
              <strong>Great visuals:</strong> Use high-quality images that showcase your project
            </li>
            <li className="mb-2">
              <strong>Promote actively:</strong> Share your campaign on social media and with your network
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
