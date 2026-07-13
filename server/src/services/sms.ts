import twilio from 'twilio';
import { env } from '../config/env';

const isMockMode =
  !env.TWILIO_ACCOUNT_SID ||
  env.TWILIO_ACCOUNT_SID.includes('your') ||
  !env.TWILIO_AUTH_TOKEN ||
  env.TWILIO_AUTH_TOKEN.includes('your');

let twilioClient: any = null;
if (!isMockMode) {
  twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

export const smsService = {
  sendSMS: async (to: string | null | undefined, message: string) => {
    if (!to) {
      console.log(`[SMS] Skipped sending message because target phone number was empty.`);
      return { sid: 'sms_skipped_no_phone' };
    }

    if (isMockMode) {
      console.log(`[SMS MOCK] Sending SMS:
        TO: ${to}
        MESSAGE: "${message}"`);
      return { sid: 'sms_mock_sid' };
    }

    try {
      const response = await twilioClient.messages.create({
        body: message,
        from: env.TWILIO_PHONE_NUMBER,
        to,
      });
      return response;
    } catch (e) {
      console.error('Twilio SMS delivery failed', e);
      throw e;
    }
  },

  sendOrderUpdate: async (to: string, orderId: string, status: string) => {
    const statusMessages: Record<string, string> = {
      accepted: `Your TRIMAKI order #${orderId} is accepted! Chef is starting prep.`,
      preparing: `Your sushi for order #${orderId} is being rolled fresh right now!`,
      packed: `Order #${orderId} is packed with cooling pads and waiting for pickup.`,
      out_for_delivery: `Rider is en route with your TRIMAKI order #${orderId}. Track live on the app.`,
      delivered: `Order #${orderId} delivered! Thank you for dining with TRIMAKI.`,
      cancelled: `Your TRIMAKI order #${orderId} was cancelled. Refund will trigger if paid.`,
    };

    const text = statusMessages[status] || `Your TRIMAKI order #${orderId} status changed to ${status}.`;
    return smsService.sendSMS(to, text);
  },

  sendDeliveryOTP: async (to: string, otp: string) => {
    const text = `Provide OTP: ${otp} to rider to complete delivery and verify cold packaging integrity.`;
    return smsService.sendSMS(to, text);
  },
};
export default smsService;
