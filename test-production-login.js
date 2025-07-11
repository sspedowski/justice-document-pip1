const https = require('https');

const testLogin = async () => {
  const data = JSON.stringify({
    username: 'admin',
    password: 'justice2025'
  });

  const options = {
    hostname: 'justice-dashboard.onrender.com',
    port: 443,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🧪 Testing login on production server...\n');
  console.log('URL: https://justice-dashboard.onrender.com/api/login');
  console.log('Payload:', { username: 'admin', password: 'justice2025' });
  console.log('---');

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', body);
      try {
        const parsed = JSON.parse(body);
        console.log('Parsed response:', parsed);
      } catch (e) {
        console.log('Could not parse JSON response');
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e);
  });

  req.write(data);
  req.end();
};

testLogin();
