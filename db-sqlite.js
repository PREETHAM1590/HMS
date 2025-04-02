const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'hospital.db');
let db;

async function initDatabase() {
  // Open database connection
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  console.log('SQLite database initialized at:', dbPath);
  
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');
  
  // Create tables if they don't exist
  await createTables();
  
  // Create admin user if it doesn't exist
  await createAdminUser();
  
  return db;
}

async function createTables() {
  // Create doctors table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      did INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      doctorname TEXT NOT NULL,
      dept TEXT NOT NULL
    )
  `);
  
  // Create patients table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      pid INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      slot TEXT NOT NULL,
      disease TEXT NOT NULL,
      time TEXT NOT NULL,
      date TEXT NOT NULL,
      dept TEXT NOT NULL,
      number TEXT NOT NULL
    )
  `);
  
  // Create test table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);
  
  // Create user table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      usertype TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);
  
  console.log('Database tables created successfully');
}

async function createAdminUser() {
  try {
    // Check if admin user exists
    const admin = await db.get('SELECT * FROM user WHERE email = ?', ['admin@hospital.com']);
    
    if (!admin) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(
        'INSERT INTO user (username, usertype, email, password) VALUES (?, ?, ?, ?)',
        ['Admin', 'Admin', 'admin@hospital.com', hashedPassword]
      );
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Helper functions for database operations
async function query(sql, params = []) {
  return await db.all(sql, params);
}

async function get(sql, params = []) {
  return await db.get(sql, params);
}

async function run(sql, params = []) {
  return await db.run(sql, params);
}

module.exports = {
  initDatabase,
  query,
  get,
  run
}; 