const admin = require('../config/firebase-admin');

/**
 * Authentication middleware
 * Verifies Firebase JWT from Authorization header
 * Attaches decoded user info to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Use: Bearer <firebase-token>'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      phone: decodedToken.phone_number || null,
      email: decodedToken.email || null
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired', message: 'Please re-authenticate' });
    }

    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid authentication token' });
  }
};

module.exports = { authenticate };
