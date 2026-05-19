const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { postStatus, getStatuses, deleteStatus } = require('../controllers/statusController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', authenticate, getStatuses);
router.post('/', authenticate, upload.single('media'), postStatus);
router.delete('/:id', authenticate, deleteStatus);

module.exports = router;
