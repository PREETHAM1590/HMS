const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open the database
const dbPath = path.join(__dirname, 'data', 'hospital.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to SQLite database at ${dbPath}`);
});

// Function to display table schema
function showTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`\nSchema for table '${tableName}':`);
      console.log('-'.repeat(50));
      
      // Print column details
      rows.forEach(column => {
        console.log(`${column.name.padEnd(20)} ${column.type.padEnd(10)} ${column.pk ? 'PRIMARY KEY' : ''} ${column.notnull ? 'NOT NULL' : ''}`);
      });
      
      resolve();
    });
  });
}

// Function to display table data
function showTableData(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`\nData in table '${tableName}':`);
      console.log('-'.repeat(50));
      
      if (rows.length === 0) {
        console.log('No data found');
      } else {
        rows.forEach(row => {
          console.log(row);
        });
      }
      
      resolve();
    });
  });
}

// Get list of all tables
db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, async (err, tables) => {
  if (err) {
    console.error(`Error getting tables: ${err.message}`);
    db.close();
    return;
  }
  
  if (tables.length === 0) {
    console.log('No tables found in the database');
    db.close();
    return;
  }
  
  console.log('Tables in the database:');
  console.log('-'.repeat(50));
  tables.forEach(table => console.log(table.name));
  
  // Show schema and data for each table
  try {
    for (const table of tables) {
      await showTableSchema(table.name);
      await showTableData(table.name);
      console.log('\n');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    db.close();
  }
}); 