// routes/authRoutes.js
import { Router } from 'express';
import { register, login, getMe, checkEmail, switchRole, validateLocation } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register',          register);
router.post('/login',             login);
router.get('/me',                 protect, getMe);
router.post('/check-email',       checkEmail);
router.post('/validate-location', validateLocation);
router.post('/switch-role',       protect, switchRole);

export default router;
