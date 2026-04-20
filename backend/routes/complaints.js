const express = require('express');
const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const Campaign = require('../models/Campaign');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Submit a complaint
// @route   POST /api/complaints
// @access  Private
router.post('/', protect, [
  body('campaign').isMongoId().withMessage('Valid campaign ID is required'),
  body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { campaign, subject, description } = req.body;

    // Verify campaign exists
    const campaignExists = await Campaign.findById(campaign);
    if (!campaignExists) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const complaint = await Complaint.create({
      user: req.user._id,
      campaign,
      subject,
      description
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('user', 'name email')
      .populate('campaign', 'title owner');

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: populatedComplaint
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ message: 'Server error submitting complaint' });
  }
});

// @desc    Get user's complaints
// @route   GET /api/complaints/my-complaints
// @access  Private
router.get('/my-complaints', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { user: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const complaints = await Complaint.find(query)
      .populate('campaign', 'title owner')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
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
    console.error('Get user complaints error:', error);
    res.status(500).json({ message: 'Server error fetching complaints' });
  }
});

module.exports = router;
