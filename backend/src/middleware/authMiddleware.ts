import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  // Handle local guest bypass token
  if (token === 'guest-mock-jwt-token') {
    req.user = {
      id: 'guest-user-id',
      email: 'guest@symptomcare.ai'
    };
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET || 'local_dev_secret_key_12345';

  jwt.verify(token, jwtSecret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired session token.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  });
};
