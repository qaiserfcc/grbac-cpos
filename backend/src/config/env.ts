import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key}. Ensure it is set in your environment.`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://qaisu:nopassword@localhost:5432/cpos',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'changeme-access',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'changeme-refresh',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? '7d',
};
