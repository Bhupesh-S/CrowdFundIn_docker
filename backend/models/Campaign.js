const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a campaign title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a campaign description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  goalAmount: {
    type: Number,
    required: [true, 'Please provide a goal amount'],
    min: [1, 'Goal amount must be at least $1']
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Please provide a deadline'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Education', 'Healthcare', 'Environment', 'Technology', 'Arts', 'Community', 'Emergency', 'Other'],
    default: 'Other'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'expired', 'rejected'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot be more than 500 characters']
  },
  donors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true
    },
    donatedAt: {
      type: Date,
      default: Date.now
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  }],
  updates: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  featuredUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for progress percentage
campaignSchema.virtual('progressPercentage').get(function() {
  return Math.min((this.currentAmount / this.goalAmount) * 100, 100);
});

// Virtual for days remaining
campaignSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const deadline = new Date(this.deadline);
  const timeDiff = deadline.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(daysDiff, 0);
});

// Virtual for total donors count
campaignSchema.virtual('totalDonors').get(function() {
  return this.donors ? this.donors.length : 0;
});

// Ensure virtual fields are serialized
campaignSchema.set('toJSON', { virtuals: true });

// Index for better query performance
campaignSchema.index({ status: 1, deadline: 1 });
campaignSchema.index({ owner: 1 });
campaignSchema.index({ category: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
