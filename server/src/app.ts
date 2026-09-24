import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import healthRouter from './modules/health/health.routes.js';
import errorHandler from './shared/middleware/errorHandler.js';

const app: Express = express();
const logger = pino();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Routes
app.use('/api/health', healthRouter);

// Global Error Handler
app.use(errorHandler);

export { app };
export default app;
