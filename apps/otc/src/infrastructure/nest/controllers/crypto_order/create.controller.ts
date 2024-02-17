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
  CreateCryptoOrderResponse,
  CreateCryptoOrderController,
  CreateCryptoOrderRequest,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CryptoOrderDatabaseRepository,
} from '@zro/otc/infrastructure';

export type CreateCryptoOrderKafkaRequest =
  KafkaMessage<CreateCryptoOrderRequest>;

export type CreateCryptoOrderKafkaResponse =
  KafkaResponse<CreateCryptoOrderResponse>;

@Controller()
@MicroserviceController()
export class CreateCryptoOrderMicroserviceController {
  /**
   * Consumer of create cryptoOrder.
   * @param cryptoOrderRepository CryptoOrder repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CRYPTO_ORDER.CREATE)
  async execute(
    @RepositoryParam(CryptoOrderDatabaseRepository)
    cryptoOrderRepository: CryptoOrderRepository,
    @LoggerParam(CreateCryptoOrderMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateCryptoOrderRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateCryptoOrderKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateCryptoOrderRequest(message);

    // Create and call cryptoOrder controller.
    const controller = new CreateCryptoOrderController(
      logger,
      cryptoOrderRepository,
    );

    // Call crypto order controller
    const cryptoOrder = await controller.execute(payload);

    // Create crypto order
    logger.info('Crypto order created.', { cryptoOrder });

    return {
      ctx,
      value: cryptoOrder,
    };
  }
}
