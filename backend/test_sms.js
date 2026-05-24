require('dotenv').config();
const { sendSMS } = require('./services/smsSend');

async function test() {
  await sendSMS('+251911234567', 'Test message from Kebele System');
}
test();
