const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Campaign = require('../models/Campaign');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get comments for a campaign
// @route   GET /api/comments/campaign/:campaignId
// @access  Public
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Get top-level comments (not replies)
    const comments = await Comment.find({ 
      campaign: campaignId, 
      parentComment: null,
      isDeleted: false 
    })
      .populate('author', 'name profilePicture')
      .populate({
        path: 'replies',
        match: { isDeleted: false },
        populate: {
          path: 'author',
          select: 'name profilePicture'
        },
        options: { sort: { createdAt: 1 } }
      })
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ 
      campaign: campaignId, 
      parentComment: null,
      isDeleted: false 
    });

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalComments: total,
        hasNext: skip + comments.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

// @desc    Add a comment to a campaign
// @route   POST /api/comments
// @access  Private
router.post('/', protect, [
  body('campaignId').isMongoId().withMessage('Valid campaign ID is required'),
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
  body('parentComment').optional().isMongoId().withMessage('Valid parent comment ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { campaignId, content, parentComment = null } = req.body;

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // If it's a reply, check if parent comment exists
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc || parentCommentDoc.isDeleted) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    // Create comment
    const comment = await Comment.create({
      campaign: campaignId,
      author: req.user._id,
      content,
      parentComment
    });

    // Populate author details
    await comment.populate('author', 'name profilePicture');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
router.put('/:id', protect, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { content } = req.body;
    const commentId = req.params.id;

    // Find comment and check ownership
    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    // Update comment
    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate('author', 'name profilePicture');

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error updating comment' });
  }
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const commentId = req.params.id;

    // Find comment and check ownership or admin privileges
    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

// @desc    Like/Unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already liked the comment
    const existingLike = comment.likes.find(like => like.user.toString() === userId.toString());

    if (existingLike) {
      // Unlike: remove the like
      comment.likes = comment.likes.filter(like => like.user.toString() !== userId.toString());
    } else {
      // Like: add the like
      comment.likes.push({ user: userId });
    }

    await comment.save();

    res.json({
      message: existingLike ? 'Comment unliked' : 'Comment liked',
      likeCount: comment.likeCount,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error processing like' });
  }
});

// @desc    Report a comment
// @route   POST /api/comments/:id/report
// @access  Private
router.post('/:id/report', protect, [
  body('reason').isIn(['spam', 'inappropriate', 'offensive', 'harassment', 'other']).withMessage('Valid reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const commentId = req.params.id;
    const { reason } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already reported this comment
    const existingReport = comment.reportedBy.find(report => report.user.toString() === userId.toString());
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this comment' });
    }

    // Add report
    comment.reportedBy.push({ user: userId, reason });
    comment.isReported = true;
    await comment.save();

    res.json({ message: 'Comment reported successfully' });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({ message: 'Server error reporting comment' });
  }
});

// @desc    Get user's comments
// @route   GET /api/comments/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({ 
      author: userId,
      isDeleted: false 
    })
      .populate('campaign', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ 
      author: userId,
      isDeleted: false 
    });

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalComments: total
      }
    });
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({ message: 'Server error fetching user comments' });
  }
});

module.exports = router;