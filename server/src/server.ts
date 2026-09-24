import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import pino from 'pino';

const logger = pino();
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

const handleShutdown = () => {
  logger.info('Shutting down...');
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
