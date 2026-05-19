const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getConversations, createConversation, createGroup } = require('../controllers/conversationController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', authenticate, getConversations);
router.post('/', authenticate, createConversation);
router.post('/group', authenticate, upload.single('avatar'), createGroup);

module.exports = router;
