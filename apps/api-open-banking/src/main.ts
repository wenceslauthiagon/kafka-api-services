import '@zro/common/utils/instrumentation.util';
import { Logger } from 'winston';
import { readFileSync, existsSync } from 'fs';
import * as waitOn from 'wait-on';
import {
  NestApplicationOptions,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import helmet from 'helmet';
import {
  DefaultExceptionFilter,
  HttpExceptionFilter,
  createKafkaTransport,
  ConsoleLoggerModule,
  ExceptionInterceptor,
  shutdown,
  RequestIdInterceptor,
  BugReportInterceptor,
  BugReportService,
  KafkaServiceInterceptor,
  KafkaService,
  LOGGER_SERVICE_PROVIDER,
  LOGGER_SERVICE,
} from '@zro/common';
import { AppModule } from '@zro/api-open-banking/infrastructure/nest/modules/app.module';

const HTTPS_KEY_FILE = process.env.APP_HTTPS_KEY_FILE;
const HTTPS_CERT_FILE = process.env.APP_HTTPS_CERT_FILE;

let app: INestApplication = null;
declare const _BUILD_INFO_: any;

async function bootstrap() {
  const appOptions: NestApplicationOptions = {
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

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const logger: Logger = app.get(LOGGER_SERVICE);
  const configService = app.get(ConfigService);
  const kafkaService = app.get(KafkaService);
  const bugReportService = app.get(BugReportService);
  const cache = app.get(CACHE_MANAGER);
  const appPort = configService.get<number>('APP_PORT', 3000);
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
    new ExceptionInterceptor(logger),
    new BugReportInterceptor(logger, bugReportService),
    new KafkaServiceInterceptor(kafkaService),
  );

  // Set default filters.
  app.useGlobalFilters(
    new DefaultExceptionFilter(logger, cache),
    new HttpExceptionFilter(logger, cache),
  );

  // Set default pipes.
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, forbidUnknownValues: false }),
  );

  // Use helmet
  app.use(helmet());

  // Enable graceful shutdown
  app.enableShutdownHooks();

  await app.init();

  // Client for all microservices.
  const service = app.connectMicroservice(
    createKafkaTransport(configService, logger),
  );

  await service.listen();

  await app.listen(appPort);

  logger.info('Microservice HTTP successfully started', { appPort });
}

function openapi() {
  const config = new DocumentBuilder()
    .setTitle('Z.ro Open Banking API')
    .setDescription('Z.ro Open Banking API')
    .setVersion(_BUILD_INFO_.package.version)
    .setContact(
      _BUILD_INFO_.package.name,
      _BUILD_INFO_.package.url,
      _BUILD_INFO_.package.email,
    )
    .setLicense('All rights reserved', _BUILD_INFO_.package.url)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: { persistAuthorization: true },
  };
  SwaggerModule.setup('api', app, document, customOptions);
}

bootstrap().catch((error) => shutdown(app, error));
