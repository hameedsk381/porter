const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Attempting to connect to:', uri.replace(/\/\/.*@/, '//****:****@')); // Mask credentials

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Connection successful!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
