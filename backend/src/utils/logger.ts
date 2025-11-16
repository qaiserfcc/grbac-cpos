import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, errors, printf, colorize, splat } = winston.format;

export const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  format: combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    printf(({ level, message, timestamp: ts, stack, ...meta }) => {
      const metaPayload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${ts} [${level}] ${stack ?? message}${metaPayload}`;
    }),
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        errors({ stack: true }),
        splat(),
        printf(({ level, message, timestamp: ts, stack, ...meta }) => {
          const metaPayload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${ts} [${level}] ${stack ?? message}${metaPayload}`;
        }),
      ),
    }),
  ],
});

export const loggerStream = {
  write: (message: string) => {
    if (typeof logger.http === 'function') {
      logger.http(message.trim());
    } else {
      logger.info(message.trim());
    }
  },
};
