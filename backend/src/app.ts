import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import { specs } from './config/swagger';
import { errorHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limit';
import { loggerStream } from './utils/logger';
import { env } from './config/env';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
const morganFormat = env.nodeEnv === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: loggerStream }));

// Swagger JSON spec endpoint
app.get('/api-docs/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api', apiRateLimiter, apiRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(errorHandler);

export default app;
