const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const userQuery = 'SELECT id, email, first_name, last_name, is_active FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }
    
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userQuery = 'SELECT id, email, first_name, last_name FROM users WHERE id = $1 AND is_active = true';
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    req.user = userResult.rows.length > 0 ? userResult.rows[0] : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };
