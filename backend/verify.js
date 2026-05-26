const fetch = require('node-fetch');

// This is just a script to check if the server is up and responsive
fetch('http://localhost:5000/api/auth/login')
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
