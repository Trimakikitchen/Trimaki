import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env';

// Gracefully handle local testing without credentials
const isMockMode =
  !env.RAZORPAY_KEY_ID ||
  env.RAZORPAY_KEY_ID.includes('your') ||
  !env.RAZORPAY_KEY_SECRET ||
  env.RAZORPAY_KEY_SECRET.includes('your');

let razorpayClient: Razorpay | null = null;
if (!isMockMode) {
  razorpayClient = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export const razorpayService = {
  /**
   * Create order object for Razorpay checkout
   */
  createOrder: async (amountInRupees: number, orderId: string) => {
    const amountInPaise = Math.round(amountInRupees * 100);

    if (isMockMode) {
      console.log(`[RAZORPAY MOCK] Creating payment order for ₹${amountInRupees} (ID: ${orderId})`);
      return {
        id: `razor_mock_ord_${crypto.randomBytes(8).toString('hex')}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        status: 'created',
      };
    }

    return razorpayClient!.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId,
    });
  },

  /**
   * Verify signature returned on frontend checkout completion callback
   */
  verifySignature: (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
  ): boolean => {
    if (isMockMode) {
      console.log(`[RAZORPAY MOCK] Verifying signature for payment ${razorpayPaymentId}`);
      return signature === 'mock-valid-signature' || signature.startsWith('mock_');
    }

    const secret = env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    return generatedSignature === signature;
  },

  /**
   * Verify standard incoming webhook signatures
   */
  verifyWebhookSignature: (rawBody: string, signature: string): boolean => {
    if (isMockMode || !env.RAZORPAY_WEBHOOK_SECRET) {
      return true;
    }

    const hmac = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET);
    hmac.update(rawBody);
    const generatedSignature = hmac.digest('hex');

    return generatedSignature === signature;
  },

  /**
   * Trigger order payment refund
   */
  refundPayment: async (paymentId: string, amountInRupees?: number) => {
    if (isMockMode) {
      console.log(`[RAZORPAY MOCK] Refunding payment ${paymentId}`);
      return {
        id: `razor_mock_ref_${crypto.randomBytes(8).toString('hex')}`,
        payment_id: paymentId,
        amount: amountInRupees ? amountInRupees * 100 : 0,
        status: 'processed',
      };
    }

    const refundPayload: any = {};
    if (amountInRupees) {
      refundPayload.amount = Math.round(amountInRupees * 100);
    }

    return razorpayClient!.payments.refund(paymentId, refundPayload);
  },
};
export default razorpayService;
