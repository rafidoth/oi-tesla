import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import healthRouter from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.module.js';
import { usersRouter } from './modules/users/users.module.js';
import { locationsRouter } from './modules/locations/locations.module.js';
import { ridesRouter } from './modules/rides/rides.module.js';
import { driverRouter } from './modules/driver/driver.module.js';
import errorHandler from './shared/middleware/errorHandler.js';

const app: Express = express();
const logger = pino();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(pinoHttp({ logger }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/driver', driverRouter);

// Global Error Handler
app.use(errorHandler);

export { app };
export default app;
