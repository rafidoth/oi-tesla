import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/AuthenticatedRequest.js';
import { UsersService } from './users.service.js';
import { UnauthorizedError } from '../../shared/errors/UnauthorizedError.js';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('UNAUTHENTICATED', 'User is not authenticated');
      }

      const user = await this.usersService.getProfile(req.user.id);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
}

export default UsersController;
