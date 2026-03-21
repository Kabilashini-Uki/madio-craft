import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userModel'
    },
    userModel: {
        type: String,
        enum: ['User', 'Artisan'],
        default: 'User'
    },
    type: {
        type: String,
        required: true,
    },
    title: String,
    body: String,
    icon: String,
    read: {
        type: Boolean,
        default: false,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
