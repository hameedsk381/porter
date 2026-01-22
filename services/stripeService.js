const Stripe = require('stripe');

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe payment intent
const createStripePaymentIntent = async (paymentData) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: paymentData.currency || 'inr',
      metadata: paymentData.metadata || {},
      automatic_payment_methods: {
        enabled: true
      }
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    throw new Error('Failed to create Stripe payment intent');
  }
};

// Confirm Stripe payment
const confirmStripePayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    console.error('Stripe payment confirmation error:', error);
    return false;
  }
};

// Create Stripe refund
const createStripeRefund = async (paymentIntentId, amount, reason = 'requested_by_customer') => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount * 100, // Convert to cents
      reason: reason
    });

    return refund;
  } catch (error) {
    console.error('Stripe refund creation error:', error);
    throw new Error('Failed to create Stripe refund');
  }
};

// Get Stripe payment intent details
const getStripePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent fetch error:', error);
    throw new Error('Failed to fetch payment intent details');
  }
};

// Create Stripe customer
const createStripeCustomer = async (customerData) => {
  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      metadata: customerData.metadata || {}
    });

    return customer;
  } catch (error) {
    console.error('Stripe customer creation error:', error);
    throw new Error('Failed to create Stripe customer');
  }
};

// Get Stripe customer
const getStripeCustomer = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Stripe customer fetch error:', error);
    throw new Error('Failed to fetch customer details');
  }
};

module.exports = {
  createStripePaymentIntent,
  confirmStripePayment,
  createStripeRefund,
  getStripePaymentIntent,
  createStripeCustomer,
  getStripeCustomer
};
