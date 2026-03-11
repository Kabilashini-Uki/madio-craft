// middleware/auth.js
import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (req.user.isSuspended) {
      return res.status(403).json({ message: 'Account suspended' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  // Use activeRole when set (role-switched users), otherwise fall back to their base role
  const effectiveRole = req.user?.activeRole || req.user?.role;
  if (!req.user || !roles.includes(effectiveRole)) {
    return res.status(403).json({
      message: `User role '${effectiveRole}' is not authorized to access this route`,
    });
  }
  next();
};
