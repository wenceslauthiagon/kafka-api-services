import Redis from 'ioredis';
import { Global, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { Mutex } from 'redis-semaphore';
import { Milliseconds } from 'cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { MissingEnvVarException } from '../exceptions';
import { InjectLogger, LoggerModule } from './logger.module';
import { DefaultException, Exception, ExceptionTypes } from '../helpers';

@Exception(ExceptionTypes.SYSTEM, 'REDIS_PATTERN_RESULT_SET_OVERFLOW')
export class RedisPatternResultSetOverflowException extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'REDIS_PATTERN_RESULT_SET_OVERFLOW',
      data,
    });
  }
}

export interface RedisConfig {
  APP_REDIS_HOST: string;
  APP_REDIS_PORT: number;
  APP_REDIS_TLS: boolean;
  APP_REDIS_KEY_PREFIX: string;
  APP_ENV: string;
}

export interface RedisKey<T = any> {
  key: string;
  data: T;
  ttl?: Milliseconds;
}

@Injectable()
export class RedisService implements OnModuleInit {
  private redis: Redis;
  private prefix: string;

  constructor(
    private readonly configService: ConfigService<RedisConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: RedisService.name });
  }

  onModuleInit(): void {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const hostname = this.configService.get<string>('APP_REDIS_HOST');
    const port = this.configService.get<number>('APP_REDIS_PORT', 6379);
    const tls = this.configService.get<string>('APP_REDIS_TLS', 'false');
    this.prefix = this.configService.get<string>('APP_REDIS_KEY_PREFIX', '');

    if (this.prefix) this.prefix += ':';

    if (!hostname) {
      throw new MissingEnvVarException(['APP_REDIS_HOST']);
    }

    const redis_options: any = {
      port,
      host: hostname,
    };

    if (tls === 'true') redis_options.tls = {};

    this.redis = new Redis(redis_options);

    this.logger.info('Redis connected!', { port, hostname });
  }

  getClient(): Redis {
    return this.redis;
  }

  private applyPrefix(pattern: string) {
    // Only apply prefix if pattern does not have it.
    return pattern?.length >= 0 && !pattern.startsWith(this.prefix)
      ? `${this.prefix}${pattern}`
      : pattern;
  }

  async set<T = any>(keys: RedisKey<T>[] | RedisKey<T>): Promise<void> {
    const pipe = this.redis.pipeline();

    if (!Array.isArray(keys)) {
      keys = [keys];
    }

    for (const k of keys) {
      const key = this.applyPrefix(k.key);
      if (k.ttl) {
        pipe.set(key, JSON.stringify(k.data), 'PX', k.ttl);
      } else {
        pipe.set(key, JSON.stringify(k.data));
      }
    }

    await pipe.exec();
  }

  async get<T = any>(key: string): Promise<RedisKey<T>> {
    key = this.applyPrefix(key);

    const data = await this.redis.get(key);
    // const ttl = await this.redis.ttl(key);
    const ttl = -1;

    // -2 means the key is expired (not exists)
    return data && ttl > -2 && { key, data: JSON.parse(data), ttl };
  }

  async search<T = any>(pattern: string): Promise<RedisKey<T>[]> {
    const keys: RedisKey<T>[] = [];

    const storedKeys = await new Promise<Set<string>>((resolve, reject) => {
      const keysNames = new Set<string>();

      const match = this.applyPrefix(pattern);

      const stream = this.redis.scanStream({ match });

      stream.on('data', (resultKeys: string[]) => {
        if (keysNames.size >= 10000) {
          stream.destroy(new RedisPatternResultSetOverflowException(pattern));
        } else {
          resultKeys.forEach((r) => keysNames.add(r));
        }
      });

      stream.on('error', (error) => {
        reject(error);
      });

      stream.on('end', () => {
        resolve(keysNames);
      });
    });

    for (const key of storedKeys) {
      const data = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      if (data && ttl > -2) {
        // -2 means the key is expired (not exists)
        keys.push({ key, data: JSON.parse(data), ttl });
      }
    }

    return keys;
  }

  async delete<T = any>(
    keys: RedisKey<T>[] | RedisKey<T> | string,
  ): Promise<void> {
    const pipe = this.redis.pipeline();

    let deleteKeys: RedisKey<T>[] = [];

    if (typeof keys === 'string') {
      if (keys.includes('*')) {
        deleteKeys = await this.search<T>(keys);
      } else {
        const data = await this.get<T>(keys);
        if (data) {
          deleteKeys = [data];
        }
      }
    } else if (!Array.isArray(keys)) {
      deleteKeys = [keys];
    } else {
      deleteKeys = keys;
    }

    for (const k of deleteKeys) {
      pipe.del(this.applyPrefix(k.key));
    }

    await pipe.exec();
  }

  async semaphore(key: string, callback: () => Promise<any>): Promise<void> {
    const client = this.getClient();
    const mutex = new Mutex(client, key);

    await mutex.acquire();

    try {
      await callback();
    } finally {
      await mutex.release();
    }
  }

  async semaphoreRefresh(
    key: string,
    lockTimeout: number,
    refreshInterval: number,
    callback: () => Promise<any> | void,
    acquireAttemptsLimit = 1,
  ): Promise<void> {
    const client = this.getClient();
    const mutex = new Mutex(client, key, {
      lockTimeout,
      refreshInterval,
      acquireAttemptsLimit,
    });

    const lockAcquired = await mutex.tryAcquire();
    if (!lockAcquired) {
      return;
    }

    this.logger.debug('Executing semaphore callback...');

    try {
      await callback();
    } finally {
      mutex.stopRefresh();
      await mutex.release();
    }
  }

  async hget<T = any>(key: string, field: string): Promise<RedisKey<T>> {
    key = this.applyPrefix(key);

    const data = await this.redis.hget(key, field);
    // const ttl = await this.redis.ttl(key);
    const ttl = -1;

    // -2 means the key is expired (not exists)
    return data && ttl > -2 && { key, data: JSON.parse(data), ttl };
  }

  async hset<T = any>(
    key: string,
    keys: RedisKey<T>[] | RedisKey<T>,
    ttl?: Milliseconds,
  ): Promise<void> {
    const pipe = this.redis.pipeline();
    key = this.applyPrefix(key);

    if (!Array.isArray(keys)) {
      keys = [keys];
    }

    const data = new Map();
    for (const k of keys) {
      data.set(k.key, JSON.stringify(k.data));
    }

    pipe.hset(key, data);

    if (ttl) {
      pipe.pexpire(key, ttl);
    }

    await pipe.exec();
  }

  async hincrby(key: string, field: string, value: number): Promise<number> {
    key = this.applyPrefix(key);

    const data = await this.redis.hincrby(key, field, value);

    return data;
  }
}

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
