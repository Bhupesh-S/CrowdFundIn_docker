const express = require('express');
const { body, validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Initialize Razorpay
const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_samplekey',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'sample_secret'
  });
  console.log('Razorpay initialized successfully');
} catch (error) {
  console.error('Razorpay initialization error:', error);
}

const router = express.Router();

// @desc    Create Razorpay order for donation
// @route   POST /api/donations/create-order
// @access  Private
router.post('/create-order', protect, [
  body('campaignId').isMongoId().withMessage('Valid campaign ID is required'),
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('isAnonymous').optional().isBoolean()
], async (req, res) => {
  try {
    console.log('=== CREATE RAZORPAY ORDER DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user ? req.user._id : 'No user');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { campaignId, amount, isAnonymous = false } = req.body;
    console.log('Parsed data:', { campaignId, amount, isAnonymous });

    // Check if campaign exists and is active
    const campaign = await Campaign.findById(campaignId);
    console.log('Campaign found:', campaign ? campaign._id : 'Not found');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    console.log('Campaign status:', campaign.status);
    if (!['active', 'pending'].includes(campaign.status)) {
      return res.status(400).json({ message: 'Campaign is not accepting donations' });
    }

    // Check if campaign deadline has passed
    console.log('Campaign deadline:', campaign.deadline);
    if (new Date() > new Date(campaign.deadline)) {
      return res.status(400).json({ message: 'Campaign deadline has passed' });
    }

    console.log('About to create Razorpay order...');
    console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.slice(0, 10)}...` : 'NOT SET');
    console.log('Razorpay Secret:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');
    
    // Check if Razorpay keys are properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log('Razorpay keys missing from environment');
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please contact administrator.',
        debug: 'Razorpay keys missing from environment variables'
      });
    }

    // Check for placeholder values
    if (process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id_here' ||
        process.env.RAZORPAY_KEY_SECRET === 'your_razorpay_secret_key_here') {
      console.log('Razorpay keys are still placeholder values');
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please contact administrator.',
        debug: 'Razorpay keys are placeholder values'
      });
    }
    
    // Check if Razorpay instance is properly initialized
    if (!razorpay) {
      console.log('Razorpay instance not initialized');
      return res.status(500).json({ 
        message: 'Payment gateway initialization failed. Please contact administrator.',
        debug: 'Razorpay instance not initialized'
      });
    }
    
    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `don_${Date.now().toString().slice(-8)}_${campaignId.slice(-8)}`,
      notes: {
        campaignId: campaignId,
        userId: req.user._id.toString(),
        isAnonymous: isAnonymous.toString()
      }
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_samplekey'
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific Razorpay authentication errors
    if (error.statusCode === 401) {
      return res.status(500).json({ 
        message: 'Payment gateway configuration error. Please contact administrator.',
        debug: 'Invalid Razorpay API credentials'
      });
    }
    
    // Handle other Razorpay errors
    if (error.error && error.error.description) {
      return res.status(500).json({ 
        message: 'Payment gateway error: ' + error.error.description,
        debug: error.error.code || 'RAZORPAY_ERROR'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error creating payment order', 
      error: error.message 
    });
  }
});

// @desc    Verify Razorpay payment and confirm donation
// @route   POST /api/donations/verify-payment
// @access  Private
router.post('/verify-payment', protect, [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Payment signature is required'),
  body('campaignId').isMongoId().withMessage('Valid campaign ID is required'),
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  body('isAnonymous').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      campaignId, 
      amount, 
      message = '', 
      isAnonymous = false 
    } = req.body;

    // Verify payment signature for Razorpay payments
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'sample_secret')
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Check if donation already exists
    const existingDonation = await Donation.findOne({ paymentIntentId: razorpay_payment_id });
    if (existingDonation) {
      return res.status(400).json({ message: 'Donation already processed' });
    }

    // Get campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Create donation record
    const donation = await Donation.create({
      donor: req.user._id,
      campaign: campaignId,
      amount: parseFloat(amount),
      message,
      isAnonymous,
      paymentIntentId: razorpay_payment_id,
      paymentStatus: 'succeeded',
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature
    });

    // Update campaign
    console.log('Updating campaign with ID:', campaignId, 'adding amount:', parseFloat(amount));
    const campaignUpdateResult = await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { currentAmount: parseFloat(amount) },
      $push: {
        donors: {
          user: req.user._id,
          amount: parseFloat(amount),
          isAnonymous,
          donatedAt: new Date()
        }
      }
    }, { new: true });
    
    console.log('Campaign updated. New currentAmount:', campaignUpdateResult?.currentAmount);

    // Update user donations
    await User.findByIdAndUpdate(req.user._id, {
      $push: { donations: donation._id }
    });

    // Check if campaign goal is reached
    const updatedCampaign = await Campaign.findById(campaignId);
    if (updatedCampaign.currentAmount >= updatedCampaign.goalAmount) {
      updatedCampaign.status = 'completed';
      await updatedCampaign.save();
    }

    const populatedDonation = await Donation.findById(donation._id)
      .populate('donor', 'name profilePicture email')
      .populate('campaign', 'title');

    // Send donation confirmation email
    try {
      const donor = await User.findById(req.user._id);
      const donationCampaign = await Campaign.findById(campaignId);
      
      if (donor && donor.email && donationCampaign) {
        await emailService.sendDonationConfirmation(
          donor.email,
          donor.name || donor.username,
          donationCampaign.title,
          parseFloat(amount),
          campaignId
        );
        console.log('Donation confirmation email sent to:', donor.email);
      }
    } catch (emailError) {
      console.error('Error sending donation confirmation email:', emailError);
      // Don't fail the donation if email fails
    }

    // Check for milestone achievements and send notifications
    try {
      const progressPercentage = Math.round((updatedCampaign.currentAmount / updatedCampaign.goalAmount) * 100);
      const milestones = [25, 50, 75, 100];
      
      for (const milestone of milestones) {
        if (progressPercentage >= milestone) {
          // Check if we've already sent this milestone notification
          const previousAmount = updatedCampaign.currentAmount - parseFloat(amount);
          const previousPercentage = Math.round((previousAmount / updatedCampaign.goalAmount) * 100);
          
          if (previousPercentage < milestone) {
            await emailService.sendMilestoneNotification(campaignId, milestone);
            console.log(`Milestone notification sent for ${milestone}% completion`);
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending milestone notification:', emailError);
      // Don't fail the donation if email fails
    }

    res.status(201).json({
      message: 'Donation successful!',
      donation: populatedDonation
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
});

// @desc    Get donations for a campaign
// @route   GET /api/donations/campaign/:campaignId
// @access  Public
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find({ 
      campaign: req.params.campaignId,
      paymentStatus: 'succeeded'
    })
      .populate('donor', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out anonymous donations' donor info
    const filteredDonations = donations.map(donation => {
      if (donation.isAnonymous) {
        return {
          ...donation.toObject(),
          donor: { name: 'Anonymous', profilePicture: '' }
        };
      }
      return donation;
    });

    const total = await Donation.countDocuments({ 
      campaign: req.params.campaignId,
      paymentStatus: 'succeeded'
    });

    res.json({
      donations: filteredDonations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDonations: total
      }
    });
  } catch (error) {
    console.error('Get campaign donations error:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
});

// @desc    Get user's donations
// @route   GET /api/donations/my-donations
// @access  Private
router.get('/my-donations', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find({ 
      donor: req.user._id,
      paymentStatus: 'succeeded'
    })
      .populate('campaign', 'title image status currentAmount goalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments({ 
      donor: req.user._id,
      paymentStatus: 'succeeded'
    });

    res.json({
      donations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDonations: total
      }
    });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({ message: 'Server error fetching user donations' });
  }
});

// @desc    Get donation statistics
// @route   GET /api/donations/stats
// @access  Private (Admin only)
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalDonations = await Donation.countDocuments({ paymentStatus: 'succeeded' });
    const totalAmount = await Donation.aggregate([
      { $match: { paymentStatus: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          paymentStatus: 'succeeded',
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalDonations,
      totalAmount: totalAmount[0]?.total || 0,
      monthlyDonations
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ message: 'Server error fetching donation statistics' });
  }
});

module.exports = router;
