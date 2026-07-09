import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/db.js';

export const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Verify user exists and is approved
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, status: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ success: false, message: `Access denied. Account is ${user.status}.` });
    }

    req.user = user; // { id, role, status }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

export const requirePolice = (req, res, next) => {
  if (req.user && req.user.role === 'police') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden. Police access only.' });
  }
};
