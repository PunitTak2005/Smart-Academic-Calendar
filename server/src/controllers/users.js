// routes/users.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// GET /api/users/me - Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    // req.user already populated by auth middleware
    res.json({ user: req.user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
