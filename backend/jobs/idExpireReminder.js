const cron = require('node-cron');
const { pool } = require('../config/connectDB');
const { sendSMS } = require('../services/smsService');

cron.schedule('0 8 * * *', async () => {
  try {

    // Find IDs expiring within 30 days
    const [rows] = await pool.query(`
      SELECT 
        i.id,
        i.idNumber,
        i.expiryDate,
        r.full_name,
        r.phone_number
      FROM id_cards i
      JOIN residents r ON i.person = r.id
      WHERE i.expiryDate BETWEEN CURDATE() 
      AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `);

    for (const resident of rows) {

      const message = `
Dear ${resident.full_name},

Your ID card (${resident.idNumber}) will expire on ${resident.expiryDate}.

Please visit your kebele office to renew your ID card before expiry.

- Kebele Administration
      `;

      await sendSMS(resident.phone_number, message);
    }

    console.log('Expiry reminder job completed.');

  } catch (err) {
    console.error('Cron Job Error:', err.message);
  }
});