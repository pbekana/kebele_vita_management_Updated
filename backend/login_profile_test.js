const axios = require('axios');

async function run() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'bekanapeter@gmail.com',
      password: 'Password123'
    });
    const token = loginRes.data.token;
    console.log("Login successful! Token:", token.substring(0, 15) + "...");

    const profileRes = await axios.get('http://localhost:5000/api/residents/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Profile data from API:", JSON.stringify(profileRes.data, null, 2));
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

run();
