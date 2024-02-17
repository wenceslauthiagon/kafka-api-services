import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Controller, OnModuleInit } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
  KafkaServiceParam,
  KafkaService,
  MissingEnvVarException,
  InjectLogger,
} from '@zro/common';
import { System } from '@zro/otc/domain';
import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import { SystemNotFoundException } from '@zro/otc/application';
import { OtcService } from '@zro/otc-bot/application';
import {
  BotOtcOrderEventEmitterControllerInterface,
  HandleSoldBotOtcOrderEventController,
  HandleSoldBotOtcOrderEventRequest,
} from '@zro/otc-bot/interface';
import {
  BotOtcOrderDatabaseRepository,
  BotOtcOrderEventKafkaEmitter,
  OtcServiceKafka,
  KAFKA_EVENTS,
} from '@zro/otc-bot/infrastructure';

export type HandleSoldBotOtcOrderEventKafkaRequest =
  KafkaMessage<HandleSoldBotOtcOrderEventRequest>;

interface BotOtcSoldOrderNestObserverConfig {
  APP_BOT_OTC_SYSTEM_NAME: string;
}

/**
 * Remittance Order events observer.
 */
@Controller()
@ObserverController()
export class SoldBotOtcOrderNestObserver implements OnModuleInit {
  private system: System;

  constructor(
    private kafkaService: KafkaService,
    private configService: ConfigService<BotOtcSoldOrderNestObserverConfig>,
    @InjectLogger() private logger: Logger,
  ) {
    this.logger = logger.child({ context: SoldBotOtcOrderNestObserver.name });
  }

  async onModuleInit() {
    const systemName = this.configService.get<string>(
      'APP_BOT_OTC_SYSTEM_NAME',
    );

    if (!systemName) {
      throw new MissingEnvVarException(['APP_BOT_OTC_SYSTEM_NAME']);
    }

    const otcService = new OtcServiceKafka(
      uuidV4(),
      this.logger,
      this.kafkaService,
    );

    this.system = await otcService.getSystemByName({ name: systemName });

    if (!this.system) {
      throw new SystemNotFoundException({ name: systemName });
    }
  }

  /**
   * Handler triggered when remittance was removed.
   *
   * @param message Event Kafka message.
   * @param remittanceOrderRepository OTC repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.BOT_OTC_ORDER.SOLD)
  async execute(
    @Payload('value') message: HandleSoldBotOtcOrderEventKafkaRequest,
    @RepositoryParam(BotOtcOrderDatabaseRepository)
    botOtcOrderRepository: BotOtcOrderRepository,
    @LoggerParam(SoldBotOtcOrderNestObserver)
    logger: Logger,
    @EventEmitterParam(BotOtcOrderEventKafkaEmitter)
    eventEmitter: BotOtcOrderEventEmitterControllerInterface,
    @KafkaServiceParam(OtcServiceKafka)
    otcService: OtcService,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleSoldBotOtcOrderEventRequest(message);

    logger.info('Handle removed event by value.', { payload });

    const controller = new HandleSoldBotOtcOrderEventController(
      logger,
      botOtcOrderRepository,
      eventEmitter,
      otcService,
      this.system,
    );

    await controller.execute(payload);

    logger.info('RemittanceOrder updated.');
  }
}
