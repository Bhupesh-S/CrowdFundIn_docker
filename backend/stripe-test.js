require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('Environment loaded:', !!process.env.STRIPE_SECRET_KEY);
console.log('Stripe key:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'Missing');

// Test Stripe initialization
if (process.env.STRIPE_SECRET_KEY) {
  console.log('Stripe initialized successfully');
} else {
  console.log('No Stripe key found');
}