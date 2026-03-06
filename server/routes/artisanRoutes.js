// routes/artisanRoutes.js
import { Router } from 'express';
import { getArtisans, getArtisan } from '../controllers/artisanController.js';

const router = Router();

router.get('/', getArtisans);
router.get('/search', getArtisans);
router.get('/:id', getArtisan);

export default router;
