const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { logCall, endCall, getCallHistory } = require('../controllers/callController');

router.get('/', authenticate, getCallHistory);
router.post('/', authenticate, logCall);
router.post('/end', authenticate, endCall);

module.exports = router;
