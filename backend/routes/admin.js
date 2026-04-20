const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const totalDonations = await Donation.countDocuments({ paymentStatus: 'succeeded' });
    
    const totalAmountRaised = await Donation.aggregate([
      { $match: { paymentStatus: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const campaignsByStatus = await Campaign.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const monthlySignups = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalUsers,
      totalCampaigns,
      totalDonations,
      totalAmountRaised: totalAmountRaised[0]?.total || 0,
      campaignsByStatus,
      usersByRole,
      monthlySignups
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error fetching admin stats' });
  }
});

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    const sortOrder = order === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .populate('createdCampaigns', 'title status currentAmount')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @desc    Update user status/role
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
router.put('/users/:id', protect, authorize('admin'), [
  body('role').optional().isIn(['donor', 'campaign_owner', 'admin']),
  body('isVerified').optional().isBoolean(),
  body('rejectionReason').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { role, isVerified, rejectionReason } = req.body;
    const updateFields = {};

    if (role) updateFields.role = role;
    if (typeof isVerified === 'boolean') {
      updateFields.isVerified = isVerified;
      if (isVerified) {
        updateFields.verifiedBy = req.user._id;
        updateFields.verifiedAt = new Date();
        updateFields.rejectionReason = undefined;
      } else if (rejectionReason) {
        updateFields.rejectionReason = rejectionReason;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// @desc    Approve/Reject donor verification
// @route   PUT /api/admin/users/:id/verify
// @access  Private (Admin only)
router.put('/users/:id/verify', protect, authorize('admin'), [
  body('isVerified').isBoolean().withMessage('Verification status is required'),
  body('rejectionReason').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { isVerified, rejectionReason } = req.body;
    const updateFields = {
      isVerified,
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    };

    if (!isVerified && rejectionReason) {
      updateFields.rejectionReason = rejectionReason;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password').populate('verifiedBy', 'name email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isVerified ? 'approved' : 'rejected'} successfully`,
      user
    });
  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({ message: 'Server error updating user verification' });
  }
});

// @desc    Get unverified donors
// @route   GET /api/admin/donors/unverified
// @access  Private (Admin only)
router.get('/donors/unverified', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const unverifiedDonors = await User.find({
      role: { $in: ['donor', 'campaign_owner'] },
      isVerified: false
    })
      .select('-password')
      .populate('donations', 'amount campaign createdAt')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      role: { $in: ['donor', 'campaign_owner'] },
      isVerified: false
    });

    res.json({
      donors: unverifiedDonors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get unverified donors error:', error);
    res.status(500).json({ message: 'Server error fetching unverified donors' });
  }
});

// @desc    Get all campaigns for admin review
// @route   GET /api/admin/campaigns
// @access  Private (Admin only)
router.get('/campaigns', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const sortOrder = order === 'desc' ? -1 : 1;

    const campaigns = await Campaign.find(query)
      .populate('owner', 'name email role')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCampaigns: total
      }
    });
  } catch (error) {
    console.error('Admin get campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching campaigns' });
  }
});

// @desc    Update campaign status
// @route   PUT /api/admin/campaigns/:id/status
// @access  Private (Admin only)
router.put('/campaigns/:id/status', protect, authorize('admin'), [
  body('status').isIn(['active', 'completed', 'cancelled', 'expired'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { status } = req.body;

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({
      message: 'Campaign status updated successfully',
      campaign
    });
  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({ message: 'Server error updating campaign status' });
  }
});

// @desc    Approve/Reject campaign verification
// @route   PUT /api/admin/campaigns/:id/verify
// @access  Private (Admin only)
router.put('/campaigns/:id/verify', protect, authorize('admin'), [
  body('isVerified').isBoolean().withMessage('Verification status is required'),
  body('rejectionReason').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { isVerified, rejectionReason } = req.body;
    const updateFields = {
      isVerified,
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    };

    if (isVerified) {
      updateFields.status = 'active';
      updateFields.rejectionReason = undefined;
    } else {
      updateFields.status = 'rejected';
      if (rejectionReason) {
        updateFields.rejectionReason = rejectionReason;
      }
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('verifiedBy', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({
      message: `Campaign ${isVerified ? 'approved' : 'rejected'} successfully`,
      campaign
    });
  } catch (error) {
    console.error('Campaign verification error:', error);
    res.status(500).json({ message: 'Server error updating campaign verification' });
  }
});

// @desc    Get unverified campaigns
// @route   GET /api/admin/campaigns/unverified
// @access  Private (Admin only)
router.get('/campaigns/unverified', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const unverifiedCampaigns = await Campaign.find({
      status: 'pending',
      isVerified: false
    })
      .populate('owner', 'name email role isVerified')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments({
      status: 'pending',
      isVerified: false
    });

    res.json({
      campaigns: unverifiedCampaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get unverified campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching unverified campaigns' });
  }
});

// @desc    Get all complaints
// @route   GET /api/admin/complaints
// @access  Private (Admin only)
router.get('/complaints', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const sortOrder = order === 'desc' ? -1 : 1;

    const complaints = await Complaint.find(query)
      .populate({
        path: 'user',
        select: 'name email role',
        options: { retainNullValues: true }
      })
      .populate({
        path: 'campaign',
        select: 'title owner',
        options: { retainNullValues: true }
      })
      .populate({
        path: 'resolvedBy',
        select: 'name email',
        options: { retainNullValues: true }
      })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error fetching complaints' });
  }
});

// @desc    Update complaint status
// @route   PUT /api/admin/complaints/:id
// @access  Private (Admin only)
router.put('/complaints/:id', protect, authorize('admin'), [
  body('status').isIn(['pending', 'in_review', 'resolved', 'dismissed']),
  body('adminNotes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { status, adminNotes } = req.body;
    const updateFields = { status };

    if (adminNotes) updateFields.adminNotes = adminNotes;
    if (status === 'resolved' || status === 'dismissed') {
      updateFields.resolvedBy = req.user._id;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('campaign', 'title owner')
      .populate('resolvedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ message: 'Server error updating complaint' });
  }
});

// @desc    Get donor history with filtering
// @route   GET /api/admin/donor-history
// @access  Private (Admin only)
router.get('/donor-history', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, donor, campaign, dateFrom, dateTo, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { paymentStatus: 'succeeded' };

    if (donor) query.donor = donor;
    if (campaign) query.campaign = campaign;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const sortOrder = order === 'desc' ? -1 : 1;

    const donations = await Donation.find(query)
      .populate({
        path: 'donor',
        select: 'name email role isVerified',
        options: { retainNullValues: true }
      })
      .populate({
        path: 'campaign',
        select: 'title owner status',
        options: { retainNullValues: true }
      })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    const totalAmount = await Donation.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      donations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
      },
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (error) {
    console.error('Get donor history error:', error);
    res.status(500).json({ message: 'Server error fetching donor history' });
  }
});

// @desc    Get reports (alias for complaints)
// @route   GET /api/admin/reports
// @access  Private (Admin only)
router.get('/reports', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const sortOrder = order === 'desc' ? -1 : 1;

    const reports = await Complaint.find(query)
      .populate({
        path: 'user',
        select: 'name email role',
        options: { retainNullValues: true }
      })
      .populate({
        path: 'campaign',
        select: 'title owner',
        options: { retainNullValues: true }
      })
      .populate({
        path: 'resolvedBy',
        select: 'name email',
        options: { retainNullValues: true }
      })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
});

module.exports = router;
