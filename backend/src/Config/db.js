const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL connected successfully');
        connection.release();
    } catch (err) {
        console.error('MySQL connection failed:', err.message);
    }
})();

module.exports = pool;