import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', details?: unknown) {
    super(403, 'FORBIDDEN', message, details);
  }
}

export default ForbiddenError;
