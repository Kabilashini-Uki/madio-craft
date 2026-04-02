import mongoose from 'mongoose';
import User from './server/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const checkRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handmade');
        const roles = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        console.log('Roles distribution:', roles);

        const originalRoles = await User.aggregate([
            { $group: { _id: '$originalRole', count: { $sum: 1 } } }
        ]);
        console.log('Original Roles distribution:', originalRoles);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkRoles();
