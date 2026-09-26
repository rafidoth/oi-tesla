import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown);
  constructor(code: string, message: string, details?: unknown);
  constructor(codeOrMessage: string = 'Resource not found', messageOrDetails?: unknown, details?: unknown) {
    if (typeof messageOrDetails === 'string') {
      super(404, codeOrMessage, messageOrDetails, details);
    } else {
      super(404, 'NOT_FOUND', codeOrMessage, messageOrDetails);
    }
  }
}

export default NotFoundError;
