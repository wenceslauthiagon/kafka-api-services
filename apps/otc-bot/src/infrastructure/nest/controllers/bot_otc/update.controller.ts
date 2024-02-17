import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  UpdateBotOtcController,
  UpdateBotOtcRequest,
  UpdateBotOtcResponse,
} from '@zro/otc-bot/interface';
import {
  BotOtcDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/otc-bot/infrastructure';
import { BotOtcRepository } from '@zro/otc-bot/domain';
import { Logger } from 'winston';

export type UpdateBotOtcKafkaRequest = KafkaMessage<UpdateBotOtcRequest>;
export type UpdateBotOtcKafkaResponse = KafkaResponse<UpdateBotOtcResponse>;

/**
 * OtcBot controller.
 */

@Controller()
@MicroserviceController()
export class UpdateBotOtcMicroServiceController {
  /**
   * Consumer of botOtc.
   *
   * @param botOtcRepository BotOtc repository.
   * @param logger Request logger.
   * @param message Request kafka message.
   * @returns Response Kafka message.
   */

  @KafkaMessagePattern(KAFKA_TOPICS.BOT_OTC.UPDATE)
  async execute(
    @RepositoryParam(BotOtcDatabaseRepository)
    botOtcRepository: BotOtcRepository,
    @LoggerParam(UpdateBotOtcMicroServiceController)
    logger: Logger,
    @Payload('value') message: UpdateBotOtcRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateBotOtcKafkaResponse> {
    logger.debug('Received message.', { value: message });

    const payload = new UpdateBotOtcRequest(message);

    const controller = new UpdateBotOtcController(logger, botOtcRepository);

    const botOtc = await controller.execute(payload);

    logger.info('BotOtc updated.', { botOtc });

    return {
      ctx,
      value: botOtc,
    };
  }
}
