const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/static/css', express.static(path.join(__dirname, 'public/css')));
app.use('/static/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'hmsprojects',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Database setup - Connect without database name first
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const dbName = process.env.DB_NAME || 'hospital1';

// Check and setup database
const setupDatabase = async () => {
    try {
        // First connect without database name to create it if needed
        const rootPool = mysql.createPool(dbConfig);
        
        try {
            // Try to create database if it doesn't exist
            await rootPool.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
            console.log(`Database ${dbName} created or already exists`);
            
            // Read SQL file
            if (fs.existsSync('./schema.sql')) {
                const sqlScript = fs.readFileSync('./schema.sql', 'utf8');
                
                // Connect to the specific database
                const connection = await mysql.createConnection({
                    ...dbConfig,
                    database: dbName,
                    multipleStatements: true // Enable multiple statements for import
                });
                
                // Execute SQL script
                await connection.query(sqlScript);
                console.log('Database schema imported successfully');
                connection.end();
            } else {
                console.log('SQL file not found. Database structure not imported.');
            }
        } catch (error) {
            console.error('Error setting up database:', error);
        } finally {
            // Close the root pool
            await rootPool.end();
        }
        
    } catch (error) {
        console.error('Database setup error:', error);
        console.error('Please make sure MySQL is running and check your credentials');
    }
};

// Main database connection pool (with database name)
const pool = mysql.createPool({
    ...dbConfig,
    database: dbName
});

// Initialize database and then start the application
setupDatabase().then(() => {
    // Authentication middleware
    const requireLogin = (req, res, next) => {
        if (!req.session.userId) {
            return res.redirect('/login');
        }
        next();
    };

    // Admin middleware
    const requireAdmin = (req, res, next) => {
        if (!req.session.userId || req.session.userType !== 'Admin') {
            return res.status(403).render('error', { message: 'Access denied. Admin privileges required.' });
        }
        next();
    };

    // Make user data available to all views
    app.use((req, res, next) => {
        res.locals.user = req.session.user;
        next();
    });

    // Routes
    app.get('/', (req, res) => {
        res.render('index', { user: req.session.user });
    });

    app.get('/login', (req, res) => {
        if (req.session.userId) {
            return res.redirect('/');
        }
        res.render('login');
    });

    app.get('/signup', (req, res) => {
        if (req.session.userId) {
            return res.redirect('/');
        }
        res.render('signup');
    });

    app.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
            
            if (rows.length > 0 && await bcrypt.compare(password, rows[0].password)) {
                req.session.userId = rows[0].id;
                req.session.userType = rows[0].usertype;
                req.session.user = {
                    id: rows[0].id,
                    username: rows[0].username,
                    email: rows[0].email,
                    usertype: rows[0].usertype
                };
                res.json({ success: true });
            } else {
                res.json({ success: false, message: 'Invalid credentials' });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.json({ success: false, message: error.message });
        }
    });

    app.post('/signup', async (req, res) => {
        try {
            const { username, email, password, usertype } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Check if email already exists
            const [existingUser] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
            if (existingUser.length > 0) {
                return res.json({ success: false, message: 'Email already exists' });
            }
            
            await pool.execute(
                'INSERT INTO user (username, usertype, email, password) VALUES (?, ?, ?, ?)',
                [username, usertype, email, hashedPassword]
            );
            
            res.json({ success: true });
        } catch (error) {
            console.error('Signup error:', error);
            res.json({ success: false, message: error.message });
        }
    });

    app.get('/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/');
    });

    // Book appointment page
    app.get('/book-appointment', requireLogin, (req, res) => {
        res.render('book-appointment');
    });

    // Patient routes
    app.post('/book-appointment', requireLogin, async (req, res) => {
        try {
            const { name, gender, slot, disease, time, date, dept, number } = req.body;
            const email = req.session.user.email;
            
            if (number.length !== 10) {
                return res.json({ success: false, message: 'Invalid phone number' });
            }
            
            await pool.execute(
                'INSERT INTO patients (email, name, gender, slot, disease, time, date, dept, number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [email, name, gender, slot, disease, time, date, dept, number]
            );
            
            res.json({ success: true });
        } catch (error) {
            console.error('Booking error:', error);
            res.json({ success: false, message: error.message });
        }
    });

    app.get('/bookings', requireLogin, async (req, res) => {
        try {
            let query = 'SELECT * FROM patients';
            let params = [];
            
            if (req.session.userType === 'Doctor') {
                // Get the doctor's department
                const [doctorRows] = await pool.execute(
                    'SELECT dept FROM doctors WHERE email = ?',
                    [req.session.user.email]
                );
                
                if (doctorRows && doctorRows.length > 0) {
                    // Filter bookings by the doctor's department
                    query += ' WHERE dept = ?';
                    params.push(doctorRows[0].dept);
                }
            } else if (req.session.userType !== 'Admin') {
                // Regular patients see only their own bookings
                query += ' WHERE email = ?';
                params.push(req.session.user.email);
            }
            
            const [bookings] = await pool.execute(query, params);
            
            res.render('booking', { bookings });
        } catch (error) {
            console.error('Fetching bookings error:', error);
            res.status(500).render('error', { message: error.message });
        }
    });

    // Admin routes
    app.get('/admin', requireAdmin, async (req, res) => {
        try {
            // Fetch necessary data for admin dashboard
            const [users] = await pool.execute('SELECT * FROM user');
            const [appointments] = await pool.execute('SELECT * FROM patients');
            const [doctors] = await pool.execute('SELECT * FROM user WHERE usertype = "Doctor"');
            
            // Get unique departments
            const [deptRows] = await pool.execute('SELECT DISTINCT dept FROM patients');
            const departments = deptRows.map(row => row.dept).filter(Boolean);
            
            res.render('admin-dashboard', { 
                users, 
                appointments, 
                doctors, 
                departments: departments || []
            });
        } catch (error) {
            console.error('Admin dashboard error:', error);
            res.status(500).render('error', { message: error.message });
        }
    });

    // User management by admin
    app.get('/admin/user/:id', requireAdmin, async (req, res) => {
        try {
            const [user] = await pool.execute('SELECT * FROM user WHERE id = ?', [req.params.id]);
            if (user.length === 0) {
                return res.status(404).render('error', { message: 'User not found' });
            }
            res.json(user[0]);
        } catch (error) {
            console.error('User fetch error:', error);
            res.status(500).render('error', { message: error.message });
        }
    });

    app.get('/admin/user/:id/delete', requireAdmin, async (req, res) => {
        try {
            await pool.execute('DELETE FROM user WHERE id = ?', [req.params.id]);
            res.redirect('/admin');
        } catch (error) {
            console.error('User delete error:', error);
            res.status(500).render('error', { message: error.message });
        }
    });

    // Appointment management by admin
    app.get('/admin/appointment/:id', requireAdmin, async (req, res) => {
        try {
            const [appointment] = await pool.execute('SELECT * FROM patients WHERE id = ?', [req.params.id]);
            if (appointment.length === 0) {
                return res.status(404).render('error', { message: 'Appointment not found' });
            }
            res.json(appointment[0]);
        } catch (error) {
            console.error('Appointment fetch error:', error);
            res.status(500).render('error', { message: error.message });
        }
    });

    app.get('/admin/appointment/:id/delete', requireAdmin, async (req, res) => {
        try {
            await pool.execute('DELETE FROM patients WHERE id = ?', [req.params.id]);
            res.redirect('/admin');
        } catch (error) {
            console.error('Appointment delete error:', error);
            res.status(500).render('error', { message: error.message });
        }
    });

    // Error handling
    app.use((req, res) => {
        res.status(404).render('error', { message: 'Page not found' });
    });

    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).render('error', { message: 'Something broke!' });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} in your browser`);
    });
}); 