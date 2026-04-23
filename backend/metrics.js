/**
 * metrics.js — Central Prometheus metrics registry for CrowdFundIn
 * All custom counters, gauges, and histograms are defined here and
 * imported by server.js and individual route files.
 */
const client = require('prom-client');

// ── Default Node.js metrics (CPU, memory, event-loop lag, etc.) ──────────────
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'crowdfundin_backend_' });

// ── HTTP Instrumentation ──────────────────────────────────────────────────────

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

// ── Donation Metrics ──────────────────────────────────────────────────────────

const donationsTotal = new client.Counter({
  name: 'crowdfundin_donations_total',
  help: 'Total number of successful donations processed'
});

const fundsRaisedTotal = new client.Counter({
  name: 'crowdfundin_funds_raised_total',
  help: 'Total funds raised across all campaigns (in INR)',
  labelNames: ['campaign_id']
});

const paymentFailuresTotal = new client.Counter({
  name: 'crowdfundin_payment_failures_total',
  help: 'Total number of payment failures'
});

// ── Campaign Metrics ──────────────────────────────────────────────────────────

const activeCampaignsGauge = new client.Gauge({
  name: 'crowdfundin_active_campaigns',
  help: 'Current number of active campaigns'
});

// ── User / Auth Metrics ───────────────────────────────────────────────────────

const userRegistrationsTotal = new client.Counter({
  name: 'crowdfundin_user_registrations_total',
  help: 'Total number of new user registrations'
});

const loginFailuresTotal = new client.Counter({
  name: 'crowdfundin_login_failures_total',
  help: 'Total number of failed login attempts'
});

// ── Image Upload Metrics ──────────────────────────────────────────────────────

const imageUploadSuccessTotal = new client.Counter({
  name: 'crowdfundin_image_upload_success_total',
  help: 'Total number of successful image uploads'
});

const imageUploadFailureTotal = new client.Counter({
  name: 'crowdfundin_image_upload_failure_total',
  help: 'Total number of failed image uploads'
});

// ── Export all metrics ────────────────────────────────────────────────────────

module.exports = {
  client,
  httpRequestCounter,
  httpRequestDuration,
  donationsTotal,
  fundsRaisedTotal,
  paymentFailuresTotal,
  activeCampaignsGauge,
  userRegistrationsTotal,
  loginFailuresTotal,
  imageUploadSuccessTotal,
  imageUploadFailureTotal
};
