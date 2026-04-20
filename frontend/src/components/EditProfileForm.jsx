import React, { useState, useEffect } from 'react';

const EditProfileForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    website: '',
    socialMedia: {
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        bio: initialData.bio || '',
        website: initialData.website || '',
        socialMedia: {
          twitter: initialData.socialMedia?.twitter || '',
          linkedin: initialData.socialMedia?.linkedin || '',
          instagram: initialData.socialMedia?.instagram || ''
        }
      });
      
      // Set initial image preview if user has a profile picture
      if (initialData.profilePicture) {
        setImagePreview(`http://localhost:5000${initialData.profilePicture}`);
      }
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Please select a valid image file (JPG, PNG, GIF)'
        }));
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Image size must be less than 5MB'
        }));
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear any previous errors
      setErrors(prev => ({
        ...prev,
        profileImage: ''
      }));
    }
  };

  // Remove selected image
  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(initialData?.profilePicture ? `http://localhost:5000${initialData.profilePicture}` : null);
    // Reset file input
    const fileInput = document.getElementById('profileImage');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name cannot be more than 50 characters';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio cannot be more than 500 characters';
    }

    if (formData.website && formData.website.length > 200) {
      newErrors.website = 'Website URL cannot be more than 200 characters';
    }

    if (formData.socialMedia.twitter && formData.socialMedia.twitter.length > 100) {
      newErrors['socialMedia.twitter'] = 'Twitter handle cannot be more than 100 characters';
    }

    if (formData.socialMedia.linkedin && formData.socialMedia.linkedin.length > 200) {
      newErrors['socialMedia.linkedin'] = 'LinkedIn URL cannot be more than 200 characters';
    }

    if (formData.socialMedia.instagram && formData.socialMedia.instagram.length > 100) {
      newErrors['socialMedia.instagram'] = 'Instagram handle cannot be more than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // If there's a profile image, we need to use FormData
      if (profileImage) {
        console.log('Sending FormData with image:', profileImage.name);
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('bio', formData.bio);
        formDataToSend.append('website', formData.website);
        formDataToSend.append('socialMedia', JSON.stringify(formData.socialMedia));
        formDataToSend.append('profileImage', profileImage);
        
        // Debug FormData contents
        for (let pair of formDataToSend.entries()) {
          console.log('FormData entry:', pair[0], pair[1]);
        }
        
        await onSave(formDataToSend, true); // true indicates FormData
      } else {
        console.log('Sending JSON data (no image)');
        // Check if any data actually changed before sending
        const hasChanges = Object.keys(formData).some(key => {
          if (key === 'socialMedia') {
            return Object.keys(formData.socialMedia).some(socialKey => 
              formData.socialMedia[socialKey] !== (initialData?.socialMedia?.[socialKey] || '')
            );
          }
          return formData[key] !== (initialData?.[key] || '');
        });
        
        if (!hasChanges) {
          console.log('No changes detected, skipping update');
          onCancel();
          return;
        }
        
        await onSave(formData, false); // false indicates JSON data
      }
    } catch (error) {
      // Error is handled by parent component
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Preview component
  const ProfilePreview = () => (
    <div className="border rounded p-3 bg-light">
      <h5 className="mb-3">Preview Changes</h5>
      
      {/* Profile Image Preview */}
      <div className="row mb-3">
        <div className="col-md-3 text-center">
          <strong>Profile Picture:</strong>
          <div className="mt-2">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile Preview"
                className="rounded-circle"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  border: '2px solid #e1e5e9'
                }}
              />
            ) : (
              <div
                className="bg-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto"
                style={{
                  width: '80px',
                  height: '80px',
                  border: '2px solid #e1e5e9'
                }}
              >
                <i className="fas fa-user fa-2x text-muted"></i>
              </div>
            )}
          </div>
        </div>
        <div className="col-md-9">
          <div className="row">
            <div className="col-md-6 mb-2">
              <strong>Name:</strong> {formData.name || 'Not provided'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-2">
        <strong>Bio:</strong>
        <div className="mt-1">
          {formData.bio ? (
            <p className="mb-0" style={{ fontSize: '14px' }}>{formData.bio}</p>
          ) : (
            <span className="text-muted">No bio provided</span>
          )}
        </div>
      </div>
      
      <div className="mb-2">
        <strong>Website:</strong> {formData.website || 'Not provided'}
      </div>
      
      <div className="mb-2">
        <strong>Social Media:</strong>
        <div className="row mt-1">
          <div className="col-4">
            <small><strong>Twitter:</strong> {formData.socialMedia.twitter || 'Not provided'}</small>
          </div>
          <div className="col-4">
            <small><strong>LinkedIn:</strong> {formData.socialMedia.linkedin || 'Not provided'}</small>
          </div>
          <div className="col-4">
            <small><strong>Instagram:</strong> {formData.socialMedia.instagram || 'Not provided'}</small>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Profile Image Upload Section */}
        <div className="mb-4">
          <label className="form-label font-weight-bold">
            Profile Picture
          </label>
          <div className="row">
            <div className="col-md-4 text-center">
              <div className="profile-image-preview mb-3">
                {imagePreview ? (
                  <div className="position-relative d-inline-block">
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="rounded-circle"
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        border: '3px solid #e1e5e9'
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="btn btn-sm btn-danger position-absolute"
                      style={{
                        top: '-5px',
                        right: '-5px',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <div
                    className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                    style={{
                      width: '120px',
                      height: '120px',
                      border: '3px dashed #ccc',
                      cursor: 'pointer'
                    }}
                    onClick={() => document.getElementById('profileImage').click()}
                  >
                    <i className="fas fa-camera fa-2x text-muted"></i>
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-8">
              <input
                type="file"
                id="profileImage"
                name="profileImage"
                className={`form-control ${errors.profileImage ? 'is-invalid' : ''}`}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('profileImage').click()}
                className="btn btn-outline btn-sm mb-2"
              >
                <i className="fas fa-upload me-2"></i>
                Choose New Picture
              </button>
              {errors.profileImage && (
                <div className="invalid-feedback d-block">{errors.profileImage}</div>
              )}
              <small className="form-text text-muted d-block">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </small>
              {profileImage && (
                <div className="text-success mt-2">
                  <i className="fas fa-check me-2"></i>
                  New image selected: {profileImage.name}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          {/* Basic Information */}
          <div className="col-md-6 mb-3">
            <label htmlFor="name" className="form-label font-weight-bold">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              maxLength="50"
              required
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name}</div>
            )}
            <small className="form-text text-muted">
              {formData.name.length}/50 characters
            </small>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="bio" className="form-label font-weight-bold">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            className={`form-control ${errors.bio ? 'is-invalid' : ''}`}
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself and your mission..."
            rows="4"
            maxLength="500"
          />
          {errors.bio && (
            <div className="invalid-feedback">{errors.bio}</div>
          )}
          <small className="form-text text-muted">
            {formData.bio.length}/500 characters
          </small>
        </div>

        <div className="mb-3">
          <label htmlFor="website" className="form-label font-weight-bold">
            Website URL
          </label>
          <input
            type="url"
            id="website"
            name="website"
            className={`form-control ${errors.website ? 'is-invalid' : ''}`}
            value={formData.website}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
            maxLength="200"
          />
          {errors.website && (
            <div className="invalid-feedback">{errors.website}</div>
          )}
          <small className="form-text text-muted">
            Include http:// or https://
          </small>
        </div>

        {/* Social Media Section */}
        <div className="mb-4">
          <h5 className="mb-3">Social Media Links</h5>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="twitter" className="form-label font-weight-bold">
                <i className="fab fa-twitter text-info me-2"></i>
                Twitter
              </label>
              <input
                type="text"
                id="twitter"
                name="socialMedia.twitter"
                className={`form-control ${errors['socialMedia.twitter'] ? 'is-invalid' : ''}`}
                value={formData.socialMedia.twitter}
                onChange={handleChange}
                placeholder="@username"
                maxLength="100"
              />
              {errors['socialMedia.twitter'] && (
                <div className="invalid-feedback">{errors['socialMedia.twitter']}</div>
              )}
              <small className="form-text text-muted">
                Enter your Twitter handle (with or without @)
              </small>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="linkedin" className="form-label font-weight-bold">
                <i className="fab fa-linkedin text-primary me-2"></i>
                LinkedIn
              </label>
              <input
                type="text"
                id="linkedin"
                name="socialMedia.linkedin"
                className={`form-control ${errors['socialMedia.linkedin'] ? 'is-invalid' : ''}`}
                value={formData.socialMedia.linkedin}
                onChange={handleChange}
                placeholder="Profile URL or username"
                maxLength="200"
              />
              {errors['socialMedia.linkedin'] && (
                <div className="invalid-feedback">{errors['socialMedia.linkedin']}</div>
              )}
              <small className="form-text text-muted">
                Full URL or just your username
              </small>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="instagram" className="form-label font-weight-bold">
                <i className="fab fa-instagram text-danger me-2"></i>
                Instagram
              </label>
              <input
                type="text"
                id="instagram"
                name="socialMedia.instagram"
                className={`form-control ${errors['socialMedia.instagram'] ? 'is-invalid' : ''}`}
                value={formData.socialMedia.instagram}
                onChange={handleChange}
                placeholder="@username"
                maxLength="100"
              />
              {errors['socialMedia.instagram'] && (
                <div className="invalid-feedback">{errors['socialMedia.instagram']}</div>
              )}
              <small className="form-text text-muted">
                Enter your Instagram handle (with or without @)
              </small>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-outline btn-small"
          >
            <i className={`fas fa-eye${showPreview ? '-slash' : ''} me-2`}></i>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {showPreview && (
          <div className="mb-4">
            <ProfilePreview />
          </div>
        )}

        {/* Form Actions */}
        <div className="d-flex gap-2 justify-content-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;