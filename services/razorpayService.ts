import Razorpay from 'razorpay';

// Use the actual Razorpay types
type RazorpayOrder = import('razorpay/dist/types/orders').Orders.RazorpayOrder;
type RazorpayPayment = import('razorpay/dist/types/payments').Payments.RazorpayPayment;
type RazorpayRefund = import('razorpay/dist/types/refunds').Refunds.RazorpayRefund;

interface OrderData {
  amount: number;
  currency?: string;
  receipt: string;
}

interface PaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string
});

// Create Razorpay order
const createRazorpayOrder = async (orderData: OrderData): Promise<RazorpayOrder> => {
  try {
    const options = {
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      receipt: orderData.receipt,
      payment_capture: 1 // Auto capture payment
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    throw new Error('Failed to create Razorpay order');
  }
};

// Verify Razorpay payment
const verifyRazorpayPayment = async (paymentData: PaymentData): Promise<boolean> => {
  try {
    const crypto = require('crypto');
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    
    // Create signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (isAuthentic) {
      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      return payment.status === 'captured';
    }

    return false;
  } catch (error: any) {
    console.error('Razorpay payment verification error:', error);
    return false;
  }
};

// Create Razorpay refund
const createRazorpayRefund = async (paymentId: string, amount: number, notes: Record<string, string> = {}): Promise<RazorpayRefund> => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Convert to paise
      notes: notes
    });

    return refund;
  } catch (error: any) {
    console.error('Razorpay refund creation error:', error);
    throw new Error('Failed to create Razorpay refund');
  }
};

// Get Razorpay payment details
const getRazorpayPayment = async (paymentId: string): Promise<RazorpayPayment> => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    console.error('Razorpay payment fetch error:', error);
    throw new Error('Failed to fetch payment details');
  }
};

// Get Razorpay order details
const getRazorpayOrder = async (orderId: string): Promise<RazorpayOrder> => {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error: any) {
    console.error('Razorpay order fetch error:', error);
    throw new Error('Failed to fetch order details');
  }
};

export {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createRazorpayRefund,
  getRazorpayPayment,
  getRazorpayOrder,
  type OrderData,
  type PaymentData,
  type RazorpayOrder,
  type RazorpayPayment,
  type RazorpayRefund
};