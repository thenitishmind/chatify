const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMessages, sendMessage, deleteForMe, deleteForEveryone } = require('../controllers/messageController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/:conversationId', authenticate, getMessages);
router.post('/:conversationId', authenticate, upload.single('media'), sendMessage);
router.delete('/:messageId/for-me', authenticate, deleteForMe);
router.delete('/:messageId/for-everyone', authenticate, deleteForEveryone);

module.exports = router;
