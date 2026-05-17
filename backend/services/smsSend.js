const africastalking = require('africastalking')({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME
});

const sms = africastalking.SMS;

const sendSMS = async (to, message) => {
  try {

    const result = await sms.send({
      to: [to],
      message,
      from: process.env.AFRICASTALKING_SENDER_ID // optional
    });

    console.log(`SMS sent to ${to}`);
    console.log(result);

  } catch (err) {
    console.error('SMS Error:', err.message);
  }
};

module.exports = { sendSMS };