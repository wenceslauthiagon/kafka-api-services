import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import {
  KAFKA_TOPICS,
  BotOtcOrderDatabaseRepository,
  BotOtcOrderEventKafkaEmitter,
  OtcServiceKafka,
} from '@zro/otc-bot/infrastructure';
import {
  UpdateBotOtcOrderByRemittanceController,
  UpdateBotOtcOrderByRemittanceRequest,
  BotOtcOrderEventEmitterControllerInterface,
} from '@zro/otc-bot/interface';

export type UpdateBotOtcOrderByRemittanceKafkaRequest =
  KafkaMessage<UpdateBotOtcOrderByRemittanceRequest>;

@Controller()
@MicroserviceController()
export class UpdateBotOtcOrderByRemittanceMicroserviceController {
  /**
   * Consumer of update bot otc order by remittance.
   * @param botOtcOrderRepository Bot Otc Order repository.
   * @param botOtcOrderEmitter Bot Otc Order event emitter.
   * @param otcService Otc service.
   * @param logger Request logger.
   * @param message Request message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BOT_OTC_ORDER.UPDATE_BY_REMITTANCE)
  async execute(
    @RepositoryParam(BotOtcOrderDatabaseRepository)
    botOtcOrderRepository: BotOtcOrderRepository,
    @EventEmitterParam(BotOtcOrderEventKafkaEmitter)
    botOtcOrderEmitter: BotOtcOrderEventEmitterControllerInterface,
    @KafkaServiceParam(OtcServiceKafka)
    otcService: OtcServiceKafka,
    @LoggerParam(UpdateBotOtcOrderByRemittanceMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateBotOtcOrderByRemittanceRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateBotOtcOrderByRemittanceRequest(message);

    // Instantiate Update Bot Otc Order by remittance controller.
    const controller = new UpdateBotOtcOrderByRemittanceController(
      logger,
      botOtcOrderRepository,
      botOtcOrderEmitter,
      otcService,
    );

    // Call update bot otc order by remittance.
    await controller.execute(payload);

    logger.info('Bot otc order updated by remittance.');
  }
}
