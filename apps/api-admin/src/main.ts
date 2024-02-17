import '@zro/common/utils/instrumentation.util';
import helmet from 'helmet';
import { readFileSync, existsSync } from 'fs';
import * as waitOn from 'wait-on';
import {
  INestApplication,
  NestApplicationOptions,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from 'winston';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import {
  HttpLoggerInterceptor,
  ResponseInterceptor,
  InstrumentationInterceptor,
  DefaultExceptionFilter,
  HttpExceptionFilter,
  RequestIdInterceptor,
  LoggerInterceptor,
  KafkaServiceInterceptor,
  KafkaService,
  ConsoleLoggerModule,
  ExceptionInterceptor,
  shutdown,
  ValidationException,
  BugReportInterceptor,
  BugReportService,
  LOGGER_SERVICE,
  LOGGER_SERVICE_PROVIDER,
} from '@zro/common';
import { AppModule } from './infrastructure/nest/modules/app.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

const HTTPS_KEY_FILE = process.env.APP_HTTPS_KEY_FILE;
const HTTPS_CERT_FILE = process.env.APP_HTTPS_CERT_FILE;

let app: INestApplication = null;
declare const _BUILD_INFO_: any;

async function bootstrap() {
  const appOptions: NestApplicationOptions = {
    cors: true,
    logger: new ConsoleLoggerModule(),
  };

  const IS_HTTPS = existsSync(HTTPS_KEY_FILE) && existsSync(HTTPS_CERT_FILE);
  if (IS_HTTPS) {
    // Load https certificates
    appOptions.httpsOptions = {
      key: readFileSync(HTTPS_KEY_FILE),
      cert: readFileSync(HTTPS_CERT_FILE),
    };
  }

  // Bootstrap the microservice (load all submodules).
  app = await NestFactory.create(AppModule, appOptions);

  const logger = app.get<Logger>(LOGGER_SERVICE);
  const configService = app.get(ConfigService);
  const kafkaService = app.get(KafkaService);
  const reflector = app.get(Reflector);
  const bugReportService = app.get(BugReportService);
  const cache = app.get(CACHE_MANAGER);
  const appPort = configService.get<number>('APP_PORT', 3333);
  const appEnv = configService.get<string>('APP_ENV', 'local');

  if (!IS_HTTPS) {
    logger.warn('Starting HTTP server! Missing key or cert files.');
  }

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
    new KafkaServiceInterceptor(kafkaService),
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
      exceptionFactory: (errors: ValidationError[]) => {
        return new ValidationException(errors);
      },
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
    .setTitle('Z.ro Bank Admin API')
    .setDescription('Z.ro Bank Admin API')
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
