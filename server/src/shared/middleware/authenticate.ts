import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/AuthenticatedRequest.js';
import { verifyToken } from '../wrappers/jwt.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';

export async function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(new UnauthorizedError('UNAUTHENTICATED', 'Missing Authorization header'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new UnauthorizedError('UNAUTHENTICATED', 'Invalid Authorization header format. Expected Bearer <token>'));
  }

  const token = parts[1];
  try {
    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export default authenticate;
