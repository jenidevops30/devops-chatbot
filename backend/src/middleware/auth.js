const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      // Allow request to continue without user object
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
    req.user = decoded;
    next();
  } catch (error) {
    // If token is invalid, we still allow the request but without a user object
    // (The chat route will handle whether to block based on guestId)
    next();
  }
};

module.exports = auth;
