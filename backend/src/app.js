const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./Routes/auth.routes');
const taskRoutes = require('./Routes/tasks.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found'
    });
});

// Central Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({ message: 'An unexpected internal error occurred' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Started Successfully on port ${PORT}`);
});