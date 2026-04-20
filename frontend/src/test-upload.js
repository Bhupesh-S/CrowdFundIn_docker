// Simple test for profile image upload functionality
// This file can be used to test the upload independently

const testImageUpload = async () => {
  const formData = new FormData();
  
  // Create a test file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file);
      
      formData.append('profileImage', file);
      formData.append('name', 'Test User');
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/campaigns/test-upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const result = await response.json();
        console.log('Upload test result:', result);
      } catch (error) {
        console.error('Upload test error:', error);
      }
    }
  };
  
  fileInput.click();
};

// Export for testing
window.testImageUpload = testImageUpload;

console.log('Upload test function available as window.testImageUpload()');