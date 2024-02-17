import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import {
  KafkaConfig,
  DefaultExceptionFilter,
  HttpExceptionFilter,
  RequestIdInterceptor,
  LoggerInterceptor,
  HttpLoggerInterceptor,
  ResponseInterceptor,
  InstrumentationInterceptor,
  createKafkaTransport,
  defaultLogger as logger,
} from '@zro/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export const initAppE2E = async (
  module: TestingModule,
): Promise<INestApplication> => {
  const app: INestApplication = module.createNestApplication();
  const reflector = app.get(Reflector);
  const configService: ConfigService<KafkaConfig> = app.get(ConfigService);
  const cache = app.get(CACHE_MANAGER);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(
    new DefaultExceptionFilter(logger, cache),
    new HttpExceptionFilter(logger, cache),
  );
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new InstrumentationInterceptor(logger),
    new LoggerInterceptor(logger),
    new HttpLoggerInterceptor(logger),
    new ResponseInterceptor(reflector),
  );

  app.connectMicroservice(createKafkaTransport(configService, logger));

  await app.startAllMicroservices();
  await app.listen(3000);

  return app;
};
