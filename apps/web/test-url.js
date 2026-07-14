const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/MONGODB_URI=(.*)/);
if (match) {
  const uri = match[1];
  console.log('URI length:', uri.length);
  for (let i = 0; i < uri.length; i++) {
    console.log(`char ${i}: '${uri[i]}' (code ${uri.charCodeAt(i)})`);
  }
}
