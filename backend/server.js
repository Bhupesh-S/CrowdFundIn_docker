const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');

// Import central metrics registry
const {
  client,
  httpRequestCounter,
  httpRequestDuration,
  activeCampaignsGauge,
  donationsTotal,
  fundsRaisedTotal,
  userRegistrationsTotal,
  imageUploadSuccessTotal
} = require('./metrics');

const Campaign = require('./models/Campaign');
const Donation = require('./models/Donation');
const User = require('./models/User');

const app = express();

// Connect to MongoDB
connectDB();

// ── Seed metrics from MongoDB on startup ─────────────────────────────────────
// Counters reset to 0 on container restart. We re-hydrate from DB so
// Grafana panels always show correct historical totals immediately.
(async () => {
  // Small delay to ensure DB connection is established
  await new Promise(r => setTimeout(r, 2000));
  try {
    // Active + pending campaigns gauge
    const activeCampaignCount = await Campaign.countDocuments({ status: { $in: ['active', 'pending'] } });
    activeCampaignsGauge.set(activeCampaignCount);
    console.log(`[metrics] active_campaigns = ${activeCampaignCount}`);

    // Total successful donations
    const donationCount = await Donation.countDocuments({ paymentStatus: 'succeeded' });
    if (donationCount > 0) donationsTotal.inc(donationCount);
    console.log(`[metrics] donations_total seeded = ${donationCount}`);

    // Total funds raised per campaign
    const fundsByCampaign = await Donation.aggregate([
      { $match: { paymentStatus: 'succeeded' } },
      { $group: { _id: '$campaign', total: { $sum: '$amount' } } }
    ]);
    for (const entry of fundsByCampaign) {
      if (entry.total > 0) {
        fundsRaisedTotal.inc({ campaign_id: entry._id.toString() }, entry.total);
      }
    }
    console.log(`[metrics] funds_raised seeded for ${fundsByCampaign.length} campaigns`);

    // Total registered users
    const userCount = await User.countDocuments();
    if (userCount > 0) userRegistrationsTotal.inc(userCount);
    console.log(`[metrics] user_registrations seeded = ${userCount}`);

    // Image uploads (campaign images)
    const withImage = await Campaign.countDocuments({ image: { $exists: true, $ne: null } });
    if (withImage > 0) imageUploadSuccessTotal.inc(withImage);
    console.log(`[metrics] image_upload_success seeded = ${withImage}`);

  } catch (err) {
    console.error('[metrics] Seeding error:', err.message);
  }
})();


// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HTTP instrumentation middleware ───────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === '/metrics') return next();

  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route,
      status: res.statusCode
    };
    httpRequestCounter.inc(labels);
    end(labels);
  });
  next();
});

// Debug middleware for authentication issues
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Auth Header:`, req.headers.authorization ? 'Present' : 'Missing');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CrowdFundIn API is running',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      campaigns: '/api/campaigns',
      donations: '/api/donations',
      complaints: '/api/complaints',
      admin: '/api/admin'
    }
  });
});

// Static files for uploaded images - set proper headers
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Prometheus metrics endpoint ───────────────────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
