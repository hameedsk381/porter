import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { env } from '../config/env.validation';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const adminPhone = '+919999999999'; // Default admin phone

        let admin = await User.findOne({ phone: adminPhone });

        if (admin) {
            console.log('Admin user already exists');
            admin.role = 'admin';
            await admin.save();
            console.log('Updated user role to admin');
        } else {
            admin = new User({
                phone: adminPhone,
                name: 'Super Admin',
                role: 'admin',
                isVerified: true,
                email: 'admin@porter.com'
            });
            await admin.save();
            console.log('Created new admin user');
        }

        console.log(`Admin Phone: ${adminPhone}`);
        console.log('Use this phone number to login. OTP will be sent (or use 123456 if in test mode)');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
