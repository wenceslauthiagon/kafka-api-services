import { Controller } from '@nestjs/common';
import {
  BotOtcOrderDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/otc-bot/infrastructure';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  GetBotOtcOrderByIdController,
  GetBotOtcOrderByIdRequest,
  GetBotOtcOrderByIdResponse,
} from '@zro/otc-bot/interface';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import { Logger } from 'winston';

export type GetBotOtcOrderByIdKafkaRequest =
  KafkaMessage<GetBotOtcOrderByIdRequest>;

export type GetBotOtcOrderByIdKafkaResponse =
  KafkaResponse<GetBotOtcOrderByIdResponse>;

@Controller()
@MicroserviceController()
export class GetBotOtcOrderByIdMicroserviceController {
  /**
   * Consumer of get bot otc orders.
   *
   * @param botOtcOrderRepository Bot Otc Order repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BOT_OTC_ORDER.GET_BY_ID)
  async execute(
    @RepositoryParam(BotOtcOrderDatabaseRepository)
    botOtcOrderRepository: BotOtcOrderRepository,
    @LoggerParam(GetBotOtcOrderByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBotOtcOrderByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBotOtcOrderByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBotOtcOrderByIdRequest(message);

    const controller = new GetBotOtcOrderByIdController(
      logger,
      botOtcOrderRepository,
    );

    const botOtcOrder = await controller.execute(payload);

    logger.debug('Bot Otc Order found.', {
      botOtcOrder,
    });

    return {
      ctx,
      value: botOtcOrder,
    };
  }
}
