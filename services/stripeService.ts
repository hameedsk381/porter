import Stripe from 'stripe';

interface PaymentData {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface CustomerData {
  email: string;
  name: string;
  phone: string;
  metadata?: Record<string, string>;
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16'
});

// Create Stripe payment intent
const createStripePaymentIntent = async (paymentData: PaymentData): Promise<Stripe.Response<Stripe.PaymentIntent>> => {
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
  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error);
    throw new Error('Failed to create Stripe payment intent');
  }
};

// Confirm Stripe payment
const confirmStripePayment = async (paymentIntentId: string): Promise<boolean> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error: any) {
    console.error('Stripe payment confirmation error:', error);
    return false;
  }
};

// Create Stripe refund
const createStripeRefund = async (paymentIntentId: string, amount: number, reason: string = 'requested_by_customer'): Promise<Stripe.Response<Stripe.Refund>> => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount * 100, // Convert to cents
      reason: reason as Stripe.RefundCreateParams.Reason
    });

    return refund;
  } catch (error: any) {
    console.error('Stripe refund creation error:', error);
    throw new Error('Failed to create Stripe refund');
  }
};

// Get Stripe payment intent details
const getStripePaymentIntent = async (paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error: any) {
    console.error('Stripe payment intent fetch error:', error);
    throw new Error('Failed to fetch payment intent details');
  }
};

// Create Stripe customer
const createStripeCustomer = async (customerData: CustomerData): Promise<Stripe.Response<Stripe.Customer>> => {
  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      metadata: customerData.metadata || {}
    });

    return customer;
  } catch (error: any) {
    console.error('Stripe customer creation error:', error);
    throw new Error('Failed to create Stripe customer');
  }
};

// Get Stripe customer
const getStripeCustomer = async (customerId: string): Promise<Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>> => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error: any) {
    console.error('Stripe customer fetch error:', error);
    throw new Error('Failed to fetch customer details');
  }
};

export {
  createStripePaymentIntent,
  confirmStripePayment,
  createStripeRefund,
  getStripePaymentIntent,
  createStripeCustomer,
  getStripeCustomer
};