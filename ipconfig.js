const os = require('os');

function getIPAddress() {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return 'IP not found';
}
console.log(getIPAddress());
const ipAddress = getIPAddress();
module.exports = { ipAddress };
