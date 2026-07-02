import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/db';

// Validation schema for Login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

// Admin Login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Validate Input
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ 
        message: 'Validation failed', 
        errors: parseResult.error.issues.map(issue => issue.message) 
      });
      return;
    }

    const { email, password } = parseResult.data;

    // 2. Find User in DB
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Avoid revealing account existence for security, return generic 401
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // 3. Verify Password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // 4. Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'bhakti-management-super-secret-key-12345';
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '24h' });

    // 5. Send cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true, // Prevent XSS
      secure: isProd, // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // 6. Return response
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Logout
export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Get current user context
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};
