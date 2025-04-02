const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testConnection() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log('Testing database connection with these settings:');
  console.log({
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    // Password hidden for security
  });

  try {
    // Create a connection
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Successfully connected to MySQL database!');
    
    // Test a simple query
    const [rows] = await connection.execute('SHOW TABLES');
    
    console.log('\nTables in the database:');
    if (rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      rows.forEach(row => {
        console.log(`- ${Object.values(row)[0]}`);
      });
    }
    
    // Close the connection
    await connection.end();
    console.log('\nConnection closed successfully.');
    
  } catch (error) {
    console.error('\nError connecting to the database:');
    console.error(error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nPossible solutions:');
      console.log('1. Check if MySQL server is running');
      console.log('2. Verify username and password in .env file');
      console.log('3. Make sure the user has proper permissions');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\nPossible solutions:');
      console.log('1. Check if MySQL server is running');
      console.log('2. Verify the host in .env file');
      console.log('3. Make sure MySQL is listening on the default port (3306)');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\nPossible solutions:');
      console.log('1. The database does not exist. Running server.js should create it.');
      console.log('2. Check the database name in .env file');
    }
  }
}

testConnection(); 