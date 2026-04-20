require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

app.post('/test-stripe', async (req, res) => {
  try {
    console.log('Testing Stripe payment intent creation...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500, // $25.00
      currency: 'usd',
      metadata: {
        campaignId: 'test',
        userId: 'test',
        isAnonymous: 'false'
      }
    });

    console.log('Payment intent created successfully:', paymentIntent.id);
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      type: error.type 
    });
  }
});

app.listen(3002, () => {
  console.log('Test server running on port 3002');
});