import { AppError } from './AppError.js';

export class InvalidTransitionError extends AppError {
  constructor(code: string, message: string = 'Invalid state transition', details?: unknown) {
    super(422, code, message, details);
  }
}

export default InvalidTransitionError;
