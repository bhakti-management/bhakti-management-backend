import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { Role } from '@prisma/client';

interface JwtPayload {
  userId: string;
}

// Middleware to authenticate requests via JWT cookie
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'bhakti-management-super-secret-key-12345';
    
    // Verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded || !decoded.userId) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    // Fetch user details from database to verify they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'User no longer exists' });
      return;
    }

    // Attach user to Request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check authorization roles
export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
      return;
    }

    next();
  };
};
