import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const redisDb = configService.get<number>('REDIS_DB', 0);

        // Use Redis URL if provided, otherwise construct from individual config
        const connectionConfig = redisUrl
          ? { url: redisUrl }
          : {
              host: redisHost,
              port: redisPort,
              password: redisPassword,
              db: redisDb,
            };

        return {
          store: redisStore,
          ...connectionConfig,
          ttl: 300000, // Default TTL: 5 minutes in milliseconds
          max: 1000, // Maximum number of items in cache
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keyPrefix: configService.get<string>('CACHE_KEY_PREFIX', 'saas_template:'),
          
          // Connection error handling
          retryDelayOnClusterDown: 300,
          enableOfflineQueue: false,
          
          // Performance settings
          connectTimeout: 10000,
          commandTimeout: 5000,
          
          // Additional Redis options
          family: 4, // IPv4
          keepAlive: true,
          
          // Serialization
          serialize: JSON.stringify,
          deserialize: JSON.parse,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
    LoggerModule,
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}