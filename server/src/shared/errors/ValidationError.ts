import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message: string = 'Validation error', details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export default ValidationError;
