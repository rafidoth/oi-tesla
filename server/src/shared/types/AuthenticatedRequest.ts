import type { Request } from 'express';
import type { JwtPayload } from '../wrappers/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export default AuthenticatedRequest;
