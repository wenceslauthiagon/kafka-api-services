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
  GetCryptoOrderByIdResponse,
  GetCryptoOrderByIdController,
  GetCryptoOrderByIdRequest,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CryptoOrderDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetCryptoOrderByIdKafkaRequest =
  KafkaMessage<GetCryptoOrderByIdRequest>;

export type GetCryptoOrderByIdKafkaResponse =
  KafkaResponse<GetCryptoOrderByIdResponse>;

@Controller()
@MicroserviceController()
export class GetCryptoOrderByIdMicroserviceController {
  /**
   * Consumer of getById cryptoOrder.
   * @param cryptoOrderRepository CryptoOrder repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CRYPTO_ORDER.GET_BY_ID)
  async execute(
    @RepositoryParam(CryptoOrderDatabaseRepository)
    cryptoOrderRepository: CryptoOrderRepository,
    @LoggerParam(GetCryptoOrderByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetCryptoOrderByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCryptoOrderByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCryptoOrderByIdRequest(message);

    // GetById and call cryptoOrder controller.
    const controller = new GetCryptoOrderByIdController(
      logger,
      cryptoOrderRepository,
    );

    // Call crypto order controller
    const cryptoOrder = await controller.execute(payload);

    // GetById crypto order
    logger.info('Getting crypto order by id.', { cryptoOrder });

    return {
      ctx,
      value: cryptoOrder,
    };
  }
}
