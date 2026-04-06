// routes/artisanRoutes.js
import { Router } from 'express';
import { getArtisans, getArtisan, getArtisanShop } from '../controllers/artisanController.js';

const router = Router();

router.get('/', getArtisans);
router.get('/search', getArtisans);
router.get('/:id/shop', getArtisanShop);
router.get('/:id', getArtisan);

export default router;
