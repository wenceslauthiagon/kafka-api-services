import '@zro/common/utils/instrumentation.util';
import * as waitOn from 'wait-on';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module, INestApplicationContext } from '@nestjs/common';
import {
  KafkaModule,
  LoggerModule,
  ConsoleLoggerModule,
  shutdown,
  LOGGER_SERVICE,
  KafkaService,
  flattenObject,
} from '@zro/common';
import {
  KAFKA_EVENTS as adminEvent,
  KAFKA_TOPICS as adminTopic,
  KAFKA_HUB as adminHub,
} from '@zro/admin/infrastructure/kafka';
import {
  KAFKA_EVENTS as apiJdpiEvent,
  KAFKA_TOPICS as apiJdpiTopic,
  KAFKA_HUB as apiJdpiHub,
} from '@zro/api-jdpi/infrastructure/kafka';
import {
  KAFKA_EVENTS as apiJiraEvent,
  KAFKA_TOPICS as apiJiraTopic,
  KAFKA_HUB as apiJiraHub,
} from '@zro/api-jira/infrastructure/kafka';
import {
  KAFKA_EVENTS as apiTopazioEvent,
  KAFKA_TOPICS as apiTopazioTopic,
  KAFKA_HUB as apiTopazioHub,
} from '@zro/api-topazio/infrastructure/kafka';
import {
  KAFKA_EVENTS as bankingEvent,
  KAFKA_TOPICS as bankingTopic,
  KAFKA_HUB as bankingHub,
} from '@zro/banking/infrastructure/kafka';
import {
  KAFKA_EVENTS as complianceEvent,
  KAFKA_TOPICS as complianceTopic,
  KAFKA_HUB as complianceHub,
} from '@zro/compliance/infrastructure/kafka';
import {
  KAFKA_EVENTS as notificationsEvent,
  KAFKA_TOPICS as notificationsTopic,
  KAFKA_HUB as notificationsHub,
} from '@zro/notifications/infrastructure/kafka';
import {
  KAFKA_EVENTS as operationsEvent,
  KAFKA_TOPICS as operationsTopic,
  KAFKA_HUB as operationsHub,
} from '@zro/operations/infrastructure/kafka';
import {
  KAFKA_EVENTS as otcEvent,
  KAFKA_TOPICS as otcTopic,
  KAFKA_HUB as otcHub,
} from '@zro/otc/infrastructure/kafka';
import {
  KAFKA_EVENTS as otcBotEvent,
  KAFKA_TOPICS as otcBotTopic,
  KAFKA_HUB as otcBotHub,
} from '@zro/otc-bot/infrastructure/kafka';
import {
  KAFKA_EVENTS as paymentsGatewayEvent,
  KAFKA_TOPICS as paymentsGatewayTopic,
  KAFKA_HUB as paymentsGatewayHub,
} from '@zro/payments-gateway/infrastructure/kafka';
import {
  KAFKA_EVENTS as pixKeysEvent,
  KAFKA_TOPICS as pixKeysTopic,
  KAFKA_HUB as pixKeysHub,
} from '@zro/pix-keys/infrastructure/kafka';
import {
  KAFKA_EVENTS as pixPaymentsEvent,
  KAFKA_TOPICS as pixPaymentsTopic,
  KAFKA_HUB as pixPaymentsHub,
} from '@zro/pix-payments/infrastructure/kafka';
import {
  KAFKA_EVENTS as pixZroPayEvent,
  KAFKA_TOPICS as pixZroPayTopic,
} from '@zro/pix-zro-pay/infrastructure/kafka';
import {
  KAFKA_EVENTS as quotationsEvent,
  KAFKA_TOPICS as quotationsTopic,
  KAFKA_HUB as quotationsHub,
} from '@zro/quotations/infrastructure/kafka';
import {
  KAFKA_EVENTS as reportsEvent,
  KAFKA_TOPICS as reportsTopic,
  KAFKA_HUB as reportsHub,
} from '@zro/reports/infrastructure/kafka';
import {
  KAFKA_EVENTS as signupEvent,
  KAFKA_TOPICS as signupTopic,
  KAFKA_HUB as signupHub,
} from '@zro/signup/infrastructure/kafka';
import {
  KAFKA_EVENTS as usersEvent,
  KAFKA_TOPICS as usersTopic,
  KAFKA_HUB as usersHub,
} from '@zro/users/infrastructure/kafka';
import {
  KAFKA_EVENTS as utilsEvent,
  KAFKA_TOPICS as utilsTopic,
  KAFKA_HUB as utilsHub,
} from '@zro/utils/infrastructure/kafka';
import {
  KAFKA_EVENTS as webhooksEvent,
  KAFKA_TOPICS as webhooksTopic,
  KAFKA_HUB as webhooksHub,
} from '@zro/webhooks/infrastructure/kafka';
import {
  KAFKA_EVENTS as cieloEvent,
  KAFKA_TOPICS as cieloTopic,
  KAFKA_HUB as cieloHub,
} from '@zro/cielo/infrastructure/kafka';
import {
  KAFKA_EVENTS as nupayEvent,
  KAFKA_TOPICS as nupayTopic,
  KAFKA_HUB as nupayHub,
} from '@zro/nupay/infrastructure/kafka';
import {
  KAFKA_EVENTS as picpayEvent,
  KAFKA_TOPICS as picpayTopic,
  KAFKA_HUB as picpayHub,
} from '@zro/picpay/infrastructure/kafka';

let app: INestApplicationContext = null;
declare const _BUILD_INFO_: any;

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.create-kafka-topics.env'] }),
    LoggerModule,
    KafkaModule.forFeature(),
  ],
})
class ScriptModule {}

/**
 * Create topics if needed and wait for leader election.
 */
async function bootstrap() {
  app = await NestFactory.createApplicationContext(ScriptModule, {
    logger: new ConsoleLoggerModule(),
  });

  const configService = app.get(ConfigService);
  const logger: Logger = app.get(LOGGER_SERVICE).child({ loggerId: uuidV4() });
  const kafkaService: KafkaService = app.get(KafkaService);

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

  logger.info('Starting script...');

  // Execute script.
  await execute(logger, kafkaService);

  logger.info('Script finished.');
  await shutdown(app);
}

async function execute(
  logger: Logger,
  kafkaService: KafkaService,
): Promise<void> {
  const topics = flattenObject({
    adminTopic,
    apiJdpiTopic,
    apiJiraTopic,
    apiTopazioTopic,
    bankingTopic,
    complianceTopic,
    notificationsTopic,
    operationsTopic,
    otcTopic,
    otcBotTopic,
    paymentsGatewayTopic,
    pixKeysTopic,
    pixPaymentsTopic,
    pixZroPayTopic,
    quotationsTopic,
    reportsTopic,
    signupTopic,
    usersTopic,
    utilsTopic,
    webhooksTopic,
    cieloTopic,
    nupayTopic,
    picpayTopic,
  });
  const events = flattenObject({
    adminEvent,
    adminHub,
    apiJdpiEvent,
    apiJdpiHub,
    apiJiraEvent,
    apiJiraHub,
    apiTopazioEvent,
    apiTopazioHub,
    bankingEvent,
    bankingHub,
    complianceEvent,
    complianceHub,
    notificationsEvent,
    notificationsHub,
    operationsEvent,
    operationsHub,
    otcEvent,
    otcHub,
    otcBotEvent,
    otcBotHub,
    paymentsGatewayEvent,
    paymentsGatewayHub,
    pixKeysEvent,
    pixKeysHub,
    pixPaymentsEvent,
    pixPaymentsHub,
    pixZroPayEvent,
    quotationsEvent,
    quotationsHub,
    reportsEvent,
    reportsHub,
    signupEvent,
    signupHub,
    usersEvent,
    usersHub,
    utilsEvent,
    utilsHub,
    webhooksEvent,
    webhooksHub,
    cieloEvent,
    cieloHub,
    nupayEvent,
    nupayHub,
    picpayEvent,
    picpayHub,
  });

  logger.info('Create topics.', { topics });
  logger.info('Create events.', { events });

  await kafkaService.createTopics(topics, events);
}

bootstrap().catch((error) => shutdown(app, error));
