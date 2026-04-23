import http from 'http';

const options = {
  hostname: 'localhost',
  port: 4040,
  path: '/api/tunnels',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Active Tunnels:');
      json.tunnels.forEach(t => {
        console.log(`${t.name}: ${t.public_url}`);
      });
    } catch (e) {
      console.log('Error parsing ngrok API response');
    }
  });
});

req.on('error', (e) => {
  console.log('Ngrok API not reachable. Is ngrok running with the web interface on 4040?');
});

req.end();
