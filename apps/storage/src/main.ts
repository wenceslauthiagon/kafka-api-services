import { Logger } from 'winston';
import { readFileSync, existsSync } from 'fs';
import {
  INestApplication,
  NestApplicationOptions,
  ValidationError,
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
  shutdown,
  HttpExceptionFilter,
  HttpLoggerInterceptor,
  ResponseInterceptor,
  ValidationException,
  ExceptionInterceptor,
  ConsoleLoggerModule,
  LOGGER_SERVICE_PROVIDER,
  LOGGER_SERVICE,
} from '@zro/common';
import { AppModule } from '@zro/storage/infrastructure/nest/modules/app.module';
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
  const reflector = app.get(Reflector);
  const cache = app.get(CACHE_MANAGER);
  const appPort = configService.get<number>('APP_PORT', 3000);
  const appEnv = configService.get<string>('APP_ENV', 'local');

  if (!IS_HTTPS) {
    logger.warn('Starting HTTP server! Missing key or cert files.');
  }

  // Build OpenAPI server.
  if (appEnv !== 'production') {
    openapi(app);
  }

  // Set default logger.
  app.useLogger(app.get(LOGGER_SERVICE_PROVIDER));

  // Log build info.
  logger.info('Build info.', { info: _BUILD_INFO_ });

  // Set default interceptors.
  app.useGlobalInterceptors(
    new HttpLoggerInterceptor(logger),
    new ResponseInterceptor(reflector),
    new ExceptionInterceptor(logger),
  );

  // Set default filters.
  app.useGlobalFilters(
    new DefaultExceptionFilter(logger, cache),
    // FIXME: Esse filtro não serve para o microserviço.
    new HttpExceptionFilter(logger, cache),
  );

  //Set default pipes.
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

function openapi(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Storage API')
    .setDescription('Z.ro Bank Storage API')
    .setVersion('0.7')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  SwaggerModule.setup('api', app, document, customOptions);
}

bootstrap().catch((error) => shutdown(app, error));
