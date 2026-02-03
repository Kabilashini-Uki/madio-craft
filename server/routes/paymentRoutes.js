const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/config', protect, (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID ? 'configured' : 'not-configured'
  });
});

module.exports = router;