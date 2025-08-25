const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper function to get the appropriate Stripe key based on environment
const getStripeKey = () => {
  const isTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  return isTest ? process.env.STRIPE_SECRET_KEY_TEST : process.env.STRIPE_SECRET_KEY_LIVE;
};

// Initialize Stripe with the appropriate key
const stripeInstance = require('stripe')(getStripeKey());

module.exports = {
  stripe: stripeInstance,
  getStripeKey
}; 