const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Centralized helper to extract bearer token / cookie
function extractToken(req) {
  // Header key can vary in casing depending on client
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  // Support token passed via cookie named "token"
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

function logDev(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH]', ...args);
  }
}

// Strict protection – request must include a valid token
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized - missing token. Provide Authorization: Bearer <token>'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      logDev('JWT error:', err.name, err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please login again.' });
      }
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User linked to token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Protect middleware error:', error);
    return res.status(500).json({ message: 'Server error during auth.' });
  }
};

// Optional authentication – attaches user if token present, never blocks
const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user; // silently attach
  } catch (err) {
    logDev('Optional auth token ignored:', err.message);
  }
  next();
};

// Role based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized - user context missing.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: role '${req.user.role}' not permitted.`
      });
    }
    next();
  };
};

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

module.exports = { protect, optionalAuth, authorize, generateToken };
