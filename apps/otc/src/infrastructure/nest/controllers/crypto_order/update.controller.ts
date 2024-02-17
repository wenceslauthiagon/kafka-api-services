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
import { CryptoOrderRepository } from '@zro/otc/domain';
import {
  UpdateCryptoOrderResponse,
  UpdateCryptoOrderController,
  UpdateCryptoOrderRequest,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CryptoOrderDatabaseRepository,
} from '@zro/otc/infrastructure';

export type UpdateCryptoOrderKafkaRequest =
  KafkaMessage<UpdateCryptoOrderRequest>;

export type UpdateCryptoOrderKafkaResponse =
  KafkaResponse<UpdateCryptoOrderResponse>;

@Controller()
@MicroserviceController()
export class UpdateCryptoOrderMicroserviceController {
  /**
   * Consumer of update cryptoOrder.
   * @param cryptoOrderRepository CryptoOrder repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CRYPTO_ORDER.UPDATE)
  async execute(
    @RepositoryParam(CryptoOrderDatabaseRepository)
    cryptoOrderRepository: CryptoOrderRepository,
    @LoggerParam(UpdateCryptoOrderMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateCryptoOrderRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateCryptoOrderKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateCryptoOrderRequest(message);

    // Update and call cryptoOrder controller.
    const controller = new UpdateCryptoOrderController(
      logger,
      cryptoOrderRepository,
    );

    // Call crypto order controller
    const cryptoOrder = await controller.execute(payload);

    // Update crypto order
    logger.info('Crypto order updated.', { cryptoOrder });

    return {
      ctx,
      value: cryptoOrder,
    };
  }
}
