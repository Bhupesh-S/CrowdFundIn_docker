const express = require('express');
const client = require('prom-client');

const app = express();
const port = process.env.PORT || 3000;

// ── Prometheus Metrics Setup ──────────────────────────────────
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'devops_app_' });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// ── Middleware: track every request ───────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
    httpRequestDuration.observe(
      { method: req.method, route: req.path },
      duration
    );
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Hello Docker!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ── Start Server ──────────────────────────────────────────────
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ DevOps Demo App running on port ${port}`);
});
