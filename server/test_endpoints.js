const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000/api${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    }).on('error', reject);
  });
}

(async function() {
  const endpoints = ['/products', '/users/profile', '/admin/stats', '/orders'];
  for (const ep of endpoints) {
    try {
      const { status } = await makeRequest(ep);
      console.log(`${ep}: HTTP ${status}`);
    } catch (e) {
      console.log(`${ep}: ERR ${e.message}`);
    }
  }
})();
