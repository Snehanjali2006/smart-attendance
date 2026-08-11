const os = require('os');

function getLanIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip over internal (127.0.0.1) and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function getAppBaseUrl(frontendPort = 5173) {
  // Priority 1: APP_BASE_URL from environment if defined
  if (process.env.APP_BASE_URL && process.env.APP_BASE_URL.trim() !== '') {
    return process.env.APP_BASE_URL.trim().replace(/\/+$/, '');
  }

  // Priority 2: Automatic LAN IPv4 detection
  const lanIp = getLanIpAddress();
  if (lanIp && lanIp !== 'localhost') {
    return `https://${lanIp}:${frontendPort}`;
  }

  // Priority 3: localhost fallback
  return `http://localhost:${frontendPort}`;
}

module.exports = {
  getLanIpAddress,
  getAppBaseUrl
};
