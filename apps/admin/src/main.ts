import '@zro/common/utils/instrumentation.util';
import * as waitOn from 'wait-on';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ConsoleLoggerModule,
  createKafkaTransport,
  shutdown,
  LOGGER_SERVICE,
  LOGGER_SERVICE_PROVIDER,
} from '@zro/common';
import { AppModule } from '@zro/admin/infrastructure/nest/modules/app.module';

let app: INestApplication = null;
declare const _BUILD_INFO_: any;

async function bootstrap() {
  // Bootstrap the microservice (load all submodules).
  app = await NestFactory.create(AppModule, {
    logger: new ConsoleLoggerModule(),
  });

  // Get kafka client configuration.
  const configService = app.get(ConfigService);
  const appPort = configService.get<number>('APP_PORT', 3000);
  const logger: Logger = app.get(LOGGER_SERVICE);

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

bootstrap().catch((error) => shutdown(app, error));
