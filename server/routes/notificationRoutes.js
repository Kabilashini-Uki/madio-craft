import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getNotifications)
    .delete(clearNotifications);

router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
