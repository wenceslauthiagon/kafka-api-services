import '@zro/common/utils/instrumentation.util';
import * as waitOn from 'wait-on';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { Logger } from 'winston';
import helmet from 'helmet';
import {
  BugReportInterceptor,
  BugReportService,
  ConsoleLoggerModule,
  DefaultExceptionFilter,
  ExceptionInterceptor,
  HttpExceptionFilter,
  HttpLoggerInterceptor,
  LoggerInterceptor,
  LOGGER_SERVICE,
  LOGGER_SERVICE_PROVIDER,
  RequestIdInterceptor,
  ResponseInterceptor,
  InstrumentationInterceptor,
  shutdown,
} from '@zro/common';
import { AppModule } from '@zro/api-caas/infrastructure/nest/modules/app.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

let app: INestApplication = null;
declare const _BUILD_INFO_: any;

async function bootstrap() {
  app = await NestFactory.create(AppModule, {
    logger: new ConsoleLoggerModule(),
  });

  const logger: Logger = app.get(LOGGER_SERVICE);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const bugReportService = app.get(BugReportService);
  const cache = app.get(CACHE_MANAGER);
  const appPort = configService.get<number>('APP_PORT', 3001);
  const appEnv = configService.get<string>('APP_ENV', 'local');

  // Build OpenAPI server.
  if (appEnv !== 'production') openapi();

  // Set default logger.
  app.useLogger(app.get(LOGGER_SERVICE_PROVIDER));

  // Log build info.
  logger.info('Build info.', { info: _BUILD_INFO_ });

  const kafkaResources = configService
    .get<string>('APP_BROKER_HOSTS', '')
    .split(',')
    .map((host: string) => `tcp:${host}`);

  // Wait for Kafka
  await Promise.any(
    kafkaResources.map((resource) => {
      logger.info('Waiting for Kafka', { resource });

      return waitOn({
        resources: [resource],
      });
    }),
  );

  logger.info('Kafka is ready.');

  // Set default interceptors.
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new InstrumentationInterceptor(logger),
    new LoggerInterceptor(logger),
    new HttpLoggerInterceptor(logger),
    new ResponseInterceptor(reflector),
    new ExceptionInterceptor(logger),
    new BugReportInterceptor(logger, bugReportService),
  );

  // Set default filters.
  app.useGlobalFilters(
    new DefaultExceptionFilter(logger, cache),
    new HttpExceptionFilter(logger, cache),
  );

  // Set default pipes.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Use helmet
  app.use(helmet());

  // Enable graceful shutdown
  app.enableShutdownHooks();

  await app.listen(appPort);

  logger.info('Microservice HTTP successfully started.', { appPort });
}

function openapi() {
  const config = new DocumentBuilder()
    .setTitle('Zrobank Crypto as a Service API')
    .setDescription(
      'The CaaS API provides endpoints for buying and selling cryptocurrencies.',
    )
    .setVersion(_BUILD_INFO_.package.version)
    .setContact(
      _BUILD_INFO_.package.name,
      _BUILD_INFO_.package.url,
      _BUILD_INFO_.package.email,
    )
    .setLicense('All rights reserved', _BUILD_INFO_.package.url)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: { persistAuthorization: true },
  };

  SwaggerModule.setup('api', app, document, customOptions);
}

bootstrap().catch((error) => shutdown(app, error));
