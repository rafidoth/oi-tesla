import { AppError } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(code: string = 'UNAUTHENTICATED', message: string = 'Authentication required', details?: unknown) {
    super(401, code, message, details);
  }
}

export default UnauthorizedError;
