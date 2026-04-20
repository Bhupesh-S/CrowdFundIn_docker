import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonationForm.css';
import toast from 'react-hot-toast';
import { donationService } from '../services/donationService';
import { useAuth } from '../context/AuthContext';

const DonationForm = ({ campaign, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const existingScript = document.getElementById('razorpay-script');
      if (existingScript) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to make a donation');
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Processing your donation...');

    try {
      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Payment gateway failed to load. Please try again.', { id: toastId });
        return;
      }

      // Create Razorpay order
      const orderData = await donationService.createOrder({
        campaignId: campaign._id || campaign.id,
        amount: donationAmount,
        comment: comment.trim(),
        isAnonymous
      });

      // Configure Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'CrowdFundIn',
        description: `Donation for ${campaign.title}`,
        image: '/logo.png', // Add your logo here
        handler: async function (response) {
          try {
            // Verify payment with backend
            await donationService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              campaignId: campaign._id || campaign.id,
              amount: donationAmount,
              message: comment.trim(),
              isAnonymous
            });

            toast.success('Thank you for your donation!', { id: toastId });
            
            // Reset form
            setAmount('');
            setComment('');
            setIsAnonymous(false);
            
            // Call success callback
            if (onSuccess) {
              onSuccess({
                amount: donationAmount,
                comment,
                isAnonymous,
                paymentId: response.razorpay_payment_id
              });
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || 'Failed to verify payment', { id: toastId });
          }
        },
        prefill: {
          name: isAnonymous ? 'Anonymous' : user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#2c3e50'
        },
        modal: {
          ondismiss: function() {
            toast.dismiss(toastId);
            setLoading(false);
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Donation error:', error);
      toast.error(error.response?.data?.message || 'Failed to process donation', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <h3 className="card-title">Support This Campaign</h3>
          <p className="text-muted mb-3">Please log in to make a donation</p>
          <button 
            className="btn btn-primary minimal-btn" 
            onClick={() => navigate('/login')}
            style={{background: '#2c3e50', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: 'none'}}>
            Log In to Donate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Make a Donation</h3>
        <p className="text-muted mb-0">Support "{campaign.title}"</p>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Donation Amount (₹)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-control"
              placeholder="Enter amount in INR"
              required
            />
            <small className="text-muted">Minimum donation: ₹1</small>
          </div>

          {/* Quick amount buttons */}
          <div className="form-group">
            <label className="form-label">Quick Select</label>
            <div className="quick-amounts">
              {[100, 500, 1000, 2000, 5000].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  className={`quick-amount-btn ${amount === quickAmount.toString() ? 'active' : ''}`}
                  onClick={() => setAmount(quickAmount.toString())}
                >
                  ₹{quickAmount}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="form-control"
              placeholder="Leave a message of support..."
              rows="3"
              maxLength="500"
            />
            <small className="text-muted">{comment.length}/500 characters</small>
          </div>

          <div className="form-group">
            <label className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span>Make this donation anonymous</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !amount}
            className="btn minimal-btn btn-large"
            style={{ width: '100%', background: '#2c3e50', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: 'none', fontWeight: 600, fontSize: '1.1rem' }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 8px 0 0' }}></div>
                Processing...
              </>
            ) : (
              `Donate ₹${amount || '0'}`
            )}
          </button>
        </form>
      </div>
      <div className="card-footer">
        <small className="text-muted">
          🔒 Your payment information is encrypted and secure. 
          Powered by Razorpay.
        </small>
      </div>
    </div>
  );
};

export default DonationForm;
