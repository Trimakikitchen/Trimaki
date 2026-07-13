import { Resend } from 'resend';
import { env } from '../config/env';

const isMockMode = !env.RESEND_API_KEY || env.RESEND_API_KEY.includes('your');

let resendClient: Resend | null = null;
if (!isMockMode) {
  resendClient = new Resend(env.RESEND_API_KEY);
}

export const emailService = {
  sendEmail: async (to: string, subject: string, html: string) => {
    if (isMockMode) {
      console.log(`[EMAIL MOCK] Sending email:
        TO: ${to}
        SUBJECT: ${subject}
        HTML Length: ${html.length} chars`);
      return { id: 'email_mock_id' };
    }

    try {
      const response = await resendClient!.emails.send({
        from: env.FROM_EMAIL,
        to,
        subject,
        html,
      });
      return response;
    } catch (e) {
      console.error('Resend email delivery failed', e);
      throw e;
    }
  },

  sendWelcomeEmail: async (to: string, fullName: string) => {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h1 style="color: #1f1f1f; font-family: 'Outfit', sans-serif;">Welcome to TRI<span style="color:#FF7A00">MAKI</span></h1>
        <p>Dear ${fullName},</p>
        <p>Thank you for creating an account with TRIMAKI. We are thrilled to bring luxury, restaurant-grade Japanese sushi rolls straight to your home.</p>
        <p>Browse our menu today and enjoy free secure cold-chain delivery on your first order above ₹1,000 using code <b>WELCOMEFRESH</b>.</p>
        <br/>
        <a href="${env.CLIENT_URL}/menu" style="background-color: #FF7A00; color: white; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block;">Explore Menu</a>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;"/>
        <p style="color: #9CA3AF; font-size: 11px;">TRIMAKI Inc., Linking Road, Bandra West, Mumbai, MH - 400050</p>
      </div>
    `;
    return emailService.sendEmail(to, 'Welcome to TRIMAKI Sushi Kitchen', html);
  },

  sendOrderConfirmation: async (
    to: string,
    fullName: string,
    orderId: string,
    itemsText: string,
    total: number
  ) => {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #1f1f1f;">Order Placed Successfully!</h2>
        <p>Hi ${fullName},</p>
        <p>Your culinary order has been received at our Bandra Kitchen Hub and is currently queued for chef acceptance.</p>
        <div style="background-color: #F5F5F5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><b>Order Reference:</b> #${orderId}</p>
          <p><b>Items:</b> ${itemsText}</p>
          <p><b>Total Bill:</b> ₹${total.toFixed(2)}</p>
        </div>
        <p>You can monitor prep updates and rider dispatch in real-time from your order tracker.</p>
        <a href="${env.CLIENT_URL}/track-order?id=${orderId}" style="background-color: #1F1F1F; color: white; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block;">Track My Order</a>
      </div>
    `;
    return emailService.sendEmail(to, `TRIMAKI Invoice Confirmation — #${orderId}`, html);
  },

  sendPasswordResetOTP: async (to: string, otp: string) => {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #1f1f1f;">Reset Your Password</h2>
        <p>We received a password reset request for your account. Provide the following OTP code to proceed:</p>
        <div style="background-color: #FFF3E5; border: 1px dashed #FF7A00; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: 800; tracking-wider; color: #FF7A00; font-family: monospace;">${otp}</span>
        </div>
        <p>If you did not request this, you can safely ignore this mail. The code is active for 10 minutes.</p>
      </div>
    `;
    return emailService.sendEmail(to, 'TRIMAKI Password Reset verification OTP', html);
  },
};
export default emailService;
