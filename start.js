const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('='.repeat(50));
console.log('Hospital Management System - Server Launcher');
console.log('='.repeat(50));
console.log('\nChoose which database to use:');
console.log('1. MySQL (requires MySQL server to be running)');
console.log('2. SQLite (no external database required)');

rl.question('\nEnter your choice (1 or 2): ', (answer) => {
  rl.close();
  
  let serverFile;
  let databaseType;
  
  if (answer === '1') {
    serverFile = 'server.js';
    databaseType = 'MySQL';
  } else if (answer === '2') {
    serverFile = 'server-sqlite.js';
    databaseType = 'SQLite';
  } else {
    console.log('Invalid choice. Defaulting to SQLite.');
    serverFile = 'server-sqlite.js';
    databaseType = 'SQLite';
  }
  
  console.log(`\nStarting server with ${databaseType} database...`);
  
  const server = spawn('node', [serverFile], { stdio: 'inherit' });
  
  server.on('close', (code) => {
    if (code !== 0) {
      console.log(`\nServer process exited with code ${code}`);
    }
  });
}); 