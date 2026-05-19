const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { searchUsers, getUser, getMe } = require('../controllers/userController');

router.get('/me', authenticate, getMe);
router.get('/search', authenticate, searchUsers);
router.get('/:id', authenticate, getUser);

module.exports = router;
