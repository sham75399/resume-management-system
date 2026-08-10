const mongoose = require('mongoose');
require('dotenv').config();

console.log('Attempting to connect to MongoDB Atlas...');
console.log('Connection string:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! Connected to MongoDB Atlas');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILED to connect:');
    console.error('Error message:', err.message);
    process.exit(1);
  });