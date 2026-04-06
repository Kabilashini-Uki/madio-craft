// middleware/auth.js
import jwt from 'jsonwebtoken';
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
  const effectiveRole = req.user?.role;
  const isBaseAdmin = req.user?.role === 'admin';

  if (!req.user || (!roles.includes(effectiveRole) && !isBaseAdmin)) {
    return res.status(403).json({
      message: `User role '${effectiveRole}' is not authorized to access this route`,
    });
  }
  next();
};

/**
 * Middleware: Allow if the user's BASE role is artisan or admin, 
 * regardless of their current activeRole (which might be 'buyer' for UI switching).
 * This ensures artisans can always access their own dashboard data.
 */
export const artisanAccess = (req, res, next) => {
  console.log(`Checking artisanAccess for User: ${req.user?._id}, Role: ${req.user?.role}`);
  if (!req.user || (req.user.role !== 'artisan' && req.user.role !== 'admin')) {
    console.warn(` Access Denied: User ${req.user?._id} is role '${req.user?.role}'`);
    return res.status(403).json({ message: 'Only artisans or admins can access this resource' });
  }
  next();
};
