import '@zro/common/utils/instrumentation.util';
import { Logger } from 'winston';
import { readFileSync, existsSync } from 'fs';
import * as waitOn from 'wait-on';
import {
  INestApplication,
  NestApplicationOptions,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import helmet from 'helmet';
import {
  DefaultExceptionFilter,
  HttpExceptionFilter,
  HttpLoggerInterceptor,
  ResponseInterceptor,
  InstrumentationInterceptor,
  createKafkaTransport,
  RequestIdInterceptor,
  ExceptionInterceptor,
  BugReportInterceptor,
  LoggerInterceptor,
  BugReportService,
  LOGGER_SERVICE_PROVIDER,
  LOGGER_SERVICE,
  ConsoleLoggerModule,
  KafkaService,
  KafkaServiceInterceptor,
  CacheInterceptor,
  ReplayInterceptor,
} from '@zro/common';
import { AppModule } from '@zro/api-jira/infrastructure/nest/modules/app.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

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

  const logger = app.get<Logger>(LOGGER_SERVICE);
  const configService = app.get(ConfigService);
  const kafkaService = app.get(KafkaService);
  const bugReportService = app.get(BugReportService);
  const reflector = app.get(Reflector);
  const cache = app.get(CACHE_MANAGER);
  const appPort = configService.get<number>('APP_PORT', 3000);
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
    new CacheInterceptor(reflector, cache),
    new KafkaServiceInterceptor(kafkaService),
    new ResponseInterceptor(reflector),
    new ReplayInterceptor(cache, logger),
    new ExceptionInterceptor(logger),
    new BugReportInterceptor(logger, bugReportService),
  );

  // Set default filters.
  app.useGlobalFilters(
    new DefaultExceptionFilter(logger, cache),
    new HttpExceptionFilter(logger, cache),
  );

  // Set default pipes.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

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

  logger.info('Microservice HTTP successfully started.', { appPort });
}

function openapi() {
  const config = new DocumentBuilder()
    .setTitle('Jira API')
    .setDescription('Z.ro Bank Jira API')
    .setVersion(_BUILD_INFO_.package.version)
    .setContact(
      _BUILD_INFO_.package.name,
      _BUILD_INFO_.package.url,
      _BUILD_INFO_.package.email,
    )
    .setLicense('All rights reserved', _BUILD_INFO_.package.url)
    .addBearerAuth({ type: 'apiKey', name: 'api-key', in: 'query' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: { persistAuthorization: true },
  };
  SwaggerModule.setup('api', app, document, customOptions);
}

bootstrap().catch(console.error);
