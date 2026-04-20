const express = require('express');
const { body, validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status = 'active',
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    // Only add status filter if status is not 'all'
    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const campaigns = await Campaign.find(query)
      .populate('owner', 'name profilePicture')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCampaigns: total,
        hasNext: skip + campaigns.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching campaigns' });
  }
});

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('owner', 'name profilePicture bio')
      .populate('donors.user', 'name profilePicture');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: 'Server error fetching campaign' });
  }
});

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private (Any authenticated user)
router.post('/', protect, 
  upload.single('image'),
  [
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('description').isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
    body('goalAmount').custom((value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 1) {
        throw new Error('Goal amount must be at least $1');
      }
      return true;
    }),
    body('deadline').isISO8601().withMessage('Please provide a valid deadline'),
    body('category').optional().isIn(['Education', 'Healthcare', 'Environment', 'Technology', 'Arts', 'Community', 'Emergency', 'Other'])
  ],
  async (req, res) => {
    try {
      // Log received data for debugging
      console.log('Campaign creation request received:', {
        body: req.body,
        file: req.file ? { filename: req.file.filename, size: req.file.size } : null
      });
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { title, description, goalAmount, deadline, category = 'other' } = req.body;

      // Check if deadline is in the future
      if (new Date(deadline) <= new Date()) {
        return res.status(400).json({ message: 'Deadline must be in the future' });
      }

      const campaignData = {
        title,
        description,
        goalAmount: parseFloat(goalAmount),
        deadline: new Date(deadline),
        category,
        owner: req.user._id
      };

      // Add image if uploaded
      if (req.file) {
        campaignData.image = `/uploads/${req.file.filename}`;
      }

      const campaign = await Campaign.create(campaignData);

      // Add campaign to user's created campaigns
      await User.findByIdAndUpdate(req.user._id, {
        $push: { createdCampaigns: campaign._id }
      });

      const populatedCampaign = await Campaign.findById(campaign._id)
        .populate('owner', 'name profilePicture');

      res.status(201).json({
        message: 'Campaign created successfully',
        campaign: populatedCampaign
      });
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({ message: 'Server error creating campaign' });
    }
  }
);

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private (Campaign Owner or Admin)
router.put('/:id', protect, 
  upload.single('image'),
  [
    body('title').optional().trim().isLength({ min: 5, max: 100 }),
    body('description').optional().isLength({ min: 20, max: 2000 }),
    body('category').optional().isIn(['Education', 'Healthcare', 'Environment', 'Technology', 'Arts', 'Community', 'Emergency', 'Other'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const campaign = await Campaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check if user is the owner or admin
      if (campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this campaign' });
      }

      const updateFields = {};
      const { title, description, category } = req.body;

      if (title) updateFields.title = title;
      if (description) updateFields.description = description;
      if (category) updateFields.category = category;

      // Add image if uploaded
      if (req.file) {
        updateFields.image = `/uploads/${req.file.filename}`;
      }

      const updatedCampaign = await Campaign.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
      ).populate('owner', 'name profilePicture');

      res.json({
        message: 'Campaign updated successfully',
        campaign: updatedCampaign
      });
    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(500).json({ message: 'Server error updating campaign' });
    }
  }
);

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Campaign Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if user is the owner or admin
    if (campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this campaign' });
    }

    // Don't allow deletion if campaign has donations
    if (campaign.currentAmount > 0) {
      return res.status(400).json({ message: 'Cannot delete campaign with existing donations' });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    // Remove from user's created campaigns
    await User.findByIdAndUpdate(campaign.owner, {
      $pull: { createdCampaigns: req.params.id }
    });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error deleting campaign' });
  }
});

// @desc    Get campaigns by user
// @route   GET /api/campaigns/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10, includeDonors } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = Campaign.find({ owner: req.params.userId })
      .populate('owner', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Include donors information if requested
    if (includeDonors === 'true') {
      query = query.populate('donors.user', 'name profilePicture');
    }

    const campaigns = await query;
    const total = await Campaign.countDocuments({ owner: req.params.userId });

    res.json({
      campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCampaigns: total
      }
    });
  } catch (error) {
    console.error('Get user campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching user campaigns' });
  }
});

// @desc    Add campaign update
// @route   POST /api/campaigns/:id/updates
// @access  Private (Campaign Owner or Admin)
router.post('/:id/updates', protect, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('content').isLength({ min: 10, max: 1000 }).withMessage('Content must be between 10 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if user is the owner or admin
    if (campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this campaign' });
    }

    const { title, content } = req.body;

    campaign.updates.unshift({
      title,
      content,
      createdAt: new Date()
    });

    await campaign.save();

    res.json({
      message: 'Campaign update added successfully',
      update: campaign.updates[0]
    });
  } catch (error) {
    console.error('Add campaign update error:', error);
    res.status(500).json({ message: 'Server error adding campaign update' });
  }
});

// @desc    Get campaign statistics
// @route   GET /api/campaigns/stats/overview
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });
    
    const totalRaised = await Campaign.aggregate([
      { $group: { _id: null, total: { $sum: '$currentAmount' } } }
    ]);

    const campaignsByCategory = await Campaign.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalRaised: totalRaised[0]?.total || 0,
      campaignsByCategory
    });
  } catch (error) {
    console.error('Campaign stats error:', error);
    res.status(500).json({ message: 'Server error fetching campaign stats' });
  }
});

module.exports = router;
