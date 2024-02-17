import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  BotOtcOrderDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/otc-bot/infrastructure';
import { BotOtcOrderRepository } from '@zro/otc-bot/domain';
import {
  GetAllBotOtcOrdersByFilterController,
  GetAllBotOtcOrdersByFilterRequest,
  GetAllBotOtcOrdersByFilterResponse,
} from '@zro/otc-bot/interface';

export type GetAllBotOtcOrdersByFilterKafkaRequest =
  KafkaMessage<GetAllBotOtcOrdersByFilterRequest>;

export type GetAllBotOtcOrdersByFilterKafkaResponse =
  KafkaResponse<GetAllBotOtcOrdersByFilterResponse>;

/**
 * Bot Otc Order controller.
 */
@Controller()
@MicroserviceController()
export class GetAllBotOtcOrdersByFilterMicroserviceController {
  /**
   * Consumer of get bot otc orders.
   *
   * @param botOtcOrderRepository Bot Otc Order repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BOT_OTC_ORDER.GET_ALL_BY_FILTER)
  async execute(
    @RepositoryParam(BotOtcOrderDatabaseRepository)
    botOtcOrderRepository: BotOtcOrderRepository,
    @LoggerParam(GetAllBotOtcOrdersByFilterMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllBotOtcOrdersByFilterRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllBotOtcOrdersByFilterKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllBotOtcOrdersByFilterRequest(message);

    // Create and call get bot otc orders controller.
    const controller = new GetAllBotOtcOrdersByFilterController(
      logger,
      botOtcOrderRepository,
    );

    // Get all bot otc orders
    const botOtcOrders = await controller.execute(payload);

    logger.debug('Bot Otc Orders found.', {
      botOtcOrders,
    });

    return {
      ctx,
      value: botOtcOrders,
    };
  }
}
