import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/AuthenticatedRequest.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ForbiddenError } from '../errors/ForbiddenError.js';

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Forbidden: Role '${req.user.role}' cannot access this resource`));
    }

    next();
  };
}

export default authorize;
