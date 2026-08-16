import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private readonly redis = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,

    maxRetriesPerRequest: 3,

    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  });

  async onModuleInit() {
    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error: any) {
      this.logger.warn(`Redis get failed for key "${key}": ${error.message}`);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);

      if (ttlSeconds) {
        await this.redis.set(key, serializedValue, 'EX', ttlSeconds);
        return;
      }

      await this.redis.set(key, serializedValue);
    } catch (error: any) {
      this.logger.warn(`Redis set failed for key "${key}": ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error: any) {
      this.logger.warn(`Redis delete failed for key "${key}": ${error.message}`);
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error: any) {
      this.logger.warn(
        `Redis deleteByPattern failed for pattern "${pattern}": ${error.message}`,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) === 1;
    } catch (error: any) {
      this.logger.warn(`Redis exists failed for key "${key}": ${error.message}`);
      return false;
    }
  }
}
