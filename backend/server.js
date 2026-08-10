const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/applicants', require('./routes/applicantRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});