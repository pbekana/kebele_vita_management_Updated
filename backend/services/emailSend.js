const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async (to, subject, text) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[Email Error] SMTP_USER or SMTP_PASS is not set in .env — email not sent.');
    return;
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Kebele System" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });

    console.log(`[Email API] OTP email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error('[Email API Error] Failed to send email:', err.message || err);
    throw err; // re-throw so caller knows it failed
  }
};

module.exports = { sendEmail };
