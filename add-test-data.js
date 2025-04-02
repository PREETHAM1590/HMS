const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Test data
const testPatients = [
  { name: 'John Smith', gender: 'Male', email: 'john@example.com', dept: 'Cardiology', disease: 'Hypertension', slot: 'morning', time: '09:00:00', date: '2023-04-15', number: '9876543210' },
  { name: 'Emma Johnson', gender: 'Female', email: 'emma@example.com', dept: 'Neurology', disease: 'Migraine', slot: 'afternoon', time: '14:30:00', date: '2023-04-16', number: '8765432109' },
  { name: 'Michael Brown', gender: 'Male', email: 'michael@example.com', dept: 'Orthopedics', disease: 'Back pain', slot: 'evening', time: '18:00:00', date: '2023-04-17', number: '7654321098' },
  { name: 'Sophia Wilson', gender: 'Female', email: 'sophia@example.com', dept: 'Dermatology', disease: 'Eczema', slot: 'morning', time: '10:30:00', date: '2023-04-18', number: '6543210987' },
  { name: 'David Garcia', gender: 'Male', email: 'david@example.com', dept: 'Ophthalmology', disease: 'Glaucoma', slot: 'afternoon', time: '15:00:00', date: '2023-04-19', number: '5432109876' },
  { name: 'Olivia Martinez', gender: 'Female', email: 'olivia@example.com', dept: 'Gynecology', disease: 'Routine checkup', slot: 'morning', time: '11:00:00', date: '2023-04-20', number: '4321098765' },
  { name: 'James Lee', gender: 'Male', email: 'james@example.com', dept: 'Pulmonology', disease: 'Asthma', slot: 'evening', time: '17:30:00', date: '2023-04-21', number: '3210987654' },
  { name: 'Ava Rodriguez', gender: 'Female', email: 'ava@example.com', dept: 'Endocrinology', disease: 'Diabetes', slot: 'afternoon', time: '13:00:00', date: '2023-04-22', number: '2109876543' },
  { name: 'William Anderson', gender: 'Male', email: 'william@example.com', dept: 'Cardiology', disease: 'Arrhythmia', slot: 'morning', time: '09:30:00', date: '2023-04-23', number: '1098765432' },
  { name: 'Isabella Thomas', gender: 'Female', email: 'isabella@example.com', dept: 'Neurology', disease: 'Seizures', slot: 'afternoon', time: '14:00:00', date: '2023-04-24', number: '0987654321' }
];

// Add test doctors
const testDoctors = [
  { email: 'doctor.cardio@hospital.com', doctorname: 'Dr. Robert Johnson', dept: 'Cardiology' },
  { email: 'doctor.neuro@hospital.com', doctorname: 'Dr. Sarah Williams', dept: 'Neurology' },
  { email: 'doctor.ortho@hospital.com', doctorname: 'Dr. Michael Chen', dept: 'Orthopedics' },
  { email: 'doctor.derm@hospital.com', doctorname: 'Dr. Lisa Martinez', dept: 'Dermatology' },
  { email: 'doctor.ophth@hospital.com', doctorname: 'Dr. James Wilson', dept: 'Ophthalmology' }
];

// Add test users
const testUsers = [
  { username: 'doctor1', usertype: 'Doctor', email: 'doctor.cardio@hospital.com', password: '$2a$10$4aDN5uX98YKV3OY10Qwo9uBQihHYXHtpNqK9N1Oz7QpLpJvipClI6' }, // Password: doctor123
  { username: 'doctor2', usertype: 'Doctor', email: 'doctor.neuro@hospital.com', password: '$2a$10$4aDN5uX98YKV3OY10Qwo9uBQihHYXHtpNqK9N1Oz7QpLpJvipClI6' }, // Password: doctor123
  { username: 'patient1', usertype: 'Patient', email: 'john@example.com', password: '$2a$10$4aDN5uX98YKV3OY10Qwo9uBQihHYXHtpNqK9N1Oz7QpLpJvipClI6' }, // Password: doctor123
  { username: 'patient2', usertype: 'Patient', email: 'emma@example.com', password: '$2a$10$4aDN5uX98YKV3OY10Qwo9uBQihHYXHtpNqK9N1Oz7QpLpJvipClI6' } // Password: doctor123
];

async function addTestData() {
  console.log('Adding test data to the database...');
  
  try {
    // Connect to the database
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database.');
    
    // Add doctors
    for (const doctor of testDoctors) {
      try {
        await connection.execute(
          'INSERT INTO doctors (email, doctorname, dept) VALUES (?, ?, ?)',
          [doctor.email, doctor.doctorname, doctor.dept]
        );
        console.log(`Added doctor: ${doctor.doctorname}`);
      } catch (error) {
        // Skip duplicates
        console.log(`Doctor already exists: ${doctor.doctorname}`);
      }
    }
    
    // Add users
    for (const user of testUsers) {
      try {
        await connection.execute(
          'INSERT INTO user (username, usertype, email, password) VALUES (?, ?, ?, ?)',
          [user.username, user.usertype, user.email, user.password]
        );
        console.log(`Added user: ${user.username}`);
      } catch (error) {
        // Skip duplicates
        console.log(`User already exists: ${user.username}`);
      }
    }
    
    // Add patients
    for (const patient of testPatients) {
      try {
        await connection.execute(
          'INSERT INTO patients (name, gender, email, dept, disease, slot, time, date, number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [patient.name, patient.gender, patient.email, patient.dept, patient.disease, patient.slot, patient.time, patient.date, patient.number]
        );
        console.log(`Added patient booking: ${patient.name}`);
      } catch (error) {
        console.error(`Error adding patient booking: ${error.message}`);
      }
    }
    
    console.log('Test data added successfully!');
    
    // Close the connection
    await connection.end();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
addTestData(); 