import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379'
    });

    redisClient.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    await redisClient.connect();
  }

  return redisClient;
}