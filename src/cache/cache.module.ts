import { Global, Module } from '@nestjs/common';
import { RedisService } from '#app/cache/redis.service.js';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class CacheModule {}
