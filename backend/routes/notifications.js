const express = require('express');
const { body, validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const { protect } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// @desc    Send campaign update to all donors
// @route   POST /api/notifications/campaign-update
// @access  Private (Campaign Owner)
router.post('/campaign-update', protect, [
  body('campaignId').isMongoId().withMessage('Valid campaign ID is required'),
  body('updateMessage').notEmpty().withMessage('Update message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { campaignId, updateMessage } = req.body;

    // Check if campaign exists and user owns it
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send updates for this campaign' });
    }

    // Send update emails to all donors
    const result = await emailService.sendCampaignUpdate(campaignId, updateMessage);

    if (result.success) {
      res.json({
        message: 'Campaign update sent successfully',
        sent: result.sent,
        failed: result.failed || 0
      });
    } else {
      res.status(500).json({
        message: 'Failed to send campaign update',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending campaign update:', error);
    res.status(500).json({ message: 'Server error sending campaign update' });
  }
});

// @desc    Test email configuration
// @route   GET /api/notifications/test-email
// @access  Private
router.get('/test-email', protect, async (req, res) => {
  try {
    const result = await emailService.testEmailConfig();
    
    if (result.success) {
      res.json({
        message: 'Email configuration is working properly',
        status: 'success'
      });
    } else {
      res.status(500).json({
        message: 'Email configuration error',
        error: result.error,
        status: 'error'
      });
    }
  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({ 
      message: 'Server error testing email configuration',
      status: 'error'
    });
  }
});

// @desc    Send milestone notification manually (admin only)
// @route   POST /api/notifications/milestone
// @access  Private
router.post('/milestone', protect, [
  body('campaignId').isMongoId().withMessage('Valid campaign ID is required'),
  body('milestone').isNumeric().isIn([25, 50, 75, 100]).withMessage('Milestone must be 25, 50, 75, or 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { campaignId, milestone } = req.body;

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // For demo purposes, allow any logged-in user. In production, add admin check:
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Admin access required' });
    // }

    // Send milestone notification
    const result = await emailService.sendMilestoneNotification(campaignId, milestone);

    if (result.success) {
      res.json({
        message: `Milestone notification (${milestone}%) sent successfully`,
        sent: result.sent,
        failed: result.failed || 0
      });
    } else {
      res.status(500).json({
        message: 'Failed to send milestone notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending milestone notification:', error);
    res.status(500).json({ message: 'Server error sending milestone notification' });
  }
});

// @desc    Get notification settings for a user
// @route   GET /api/notifications/settings
// @access  Private
router.get('/settings', protect, async (req, res) => {
  try {
    // For now, return default settings. In the future, this could be stored in user preferences
    const settings = {
      donationConfirmation: true,
      campaignUpdates: true,
      milestoneNotifications: true,
      emailFrequency: 'immediate' // 'immediate', 'daily', 'weekly'
    };

    res.json({
      message: 'Notification settings retrieved successfully',
      settings
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ message: 'Server error getting notification settings' });
  }
});

// @desc    Update notification settings for a user
// @route   PUT /api/notifications/settings
// @access  Private
router.put('/settings', protect, [
  body('donationConfirmation').optional().isBoolean(),
  body('campaignUpdates').optional().isBoolean(),
  body('milestoneNotifications').optional().isBoolean(),
  body('emailFrequency').optional().isIn(['immediate', 'daily', 'weekly'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // For now, just return success. In the future, save to user preferences in database
    const updatedSettings = {
      donationConfirmation: req.body.donationConfirmation ?? true,
      campaignUpdates: req.body.campaignUpdates ?? true,
      milestoneNotifications: req.body.milestoneNotifications ?? true,
      emailFrequency: req.body.emailFrequency || 'immediate'
    };

    res.json({
      message: 'Notification settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Server error updating notification settings' });
  }
});

module.exports = router;