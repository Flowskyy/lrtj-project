const { spawn } = require('child_process');
const os = require('os');

// Get LAN IP address
function getLanIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Skip 127.0.0.1 and look for LAN IPs
        if (iface.address !== '127.0.0.1') {
          return iface.address;
        }
      }
    }
  }
  return '172.16.12.230'; // fallback to known LAN IP
}

const lanIP = getLanIP();
let hasShownLanInfo = false;

// Start Next.js dev server
const devServer = spawn('npx', ['next', 'dev', '-H', '0.0.0.0'], {
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true
});

devServer.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Check if Next.js has started and print LAN info (only once)
  if (!hasShownLanInfo && (output.includes('Ready in') || output.includes('Local:'))) {
    hasShownLanInfo = true;
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Local:   http://localhost:3000`);
    console.log(`  LAN:     http://${lanIP}:3000`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n');
  }
});

devServer.on('close', (code) => {
  console.log(`Dev server exited with code ${code}`);
});
