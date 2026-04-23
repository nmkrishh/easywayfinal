import http from 'http';

const options = {
  hostname: 'localhost',
  port: 4040,
  path: '/api/requests/http',
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
      console.log('Ngrok Requests:');
      json.requests.forEach(r => {
        console.log(`${r.request.method} ${r.request.uri} - Status: ${r.response.status_code}`);
      });
      if (json.requests.length === 0) {
        console.log("No requests found in ngrok history.");
      }
    } catch (e) {
      console.log('Error parsing ngrok API response');
    }
  });
});

req.on('error', (e) => {
  console.log('Ngrok API not reachable.');
});

req.end();
