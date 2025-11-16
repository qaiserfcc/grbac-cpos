import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env';

const maxRequests = env.nodeEnv === 'test' ? 1000 : 200;

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  handler: (_req, res) => {
    res
      .status(StatusCodes.TOO_MANY_REQUESTS)
      .json({ message: 'Too many requests, please try again later.' });
  },
});
