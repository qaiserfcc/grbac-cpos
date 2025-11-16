import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      logger.info(`🚀 Backend listening on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

bootstrap();
