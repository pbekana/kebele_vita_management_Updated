const africastalking = require('africastalking')({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
});

const sms = africastalking.SMS;

/**
 * Converts Ethiopian local phone number (09xxxxxxxx) to international format (+2519xxxxxxxx).
 */
const toInternational = (phone) => {
  const cleaned = phone.replace(/\s+/g, '').trim();
  if (cleaned.startsWith('+')) return cleaned; // already international
  if (cleaned.startsWith('09')) return '+251' + cleaned.slice(1); // 09... → +2519...
  if (cleaned.startsWith('07')) return '+251' + cleaned.slice(1); // 07... → +2517...
  if (cleaned.startsWith('251')) return '+' + cleaned; // 251... → +251...
  return cleaned; // return as-is if unknown format
};

const sendSMS = async (to, message) => {
  const formattedNumber = toInternational(to);

  try {
    const options = {
      to: [formattedNumber],
      message,
    };

    // Only set sender ID if it's a valid registered sender ID (not the default "Kebele")
    if (
      process.env.AFRICASTALKING_SENDER_ID &&
      process.env.AFRICASTALKING_SENDER_ID !== 'Kebele'
    ) {
      options.from = process.env.AFRICASTALKING_SENDER_ID;
    }

    const result = await sms.send(options);
    console.log(`[SMS API] Sent to ${formattedNumber}:`, JSON.stringify(result));
  } catch (err) {
    // SMS failure is non-fatal — log it but don't crash registration
    console.error(`[SMS API Error] Failed to send SMS to ${formattedNumber}:`, err.message || err);
  }
};

module.exports = { sendSMS };