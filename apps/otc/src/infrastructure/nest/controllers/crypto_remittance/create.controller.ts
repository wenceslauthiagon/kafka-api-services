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
import { CryptoRemittanceRepository } from '@zro/otc/domain';
import {
  CreateCryptoRemittanceResponse,
  CreateCryptoRemittanceController,
  CreateCryptoRemittanceRequest,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CryptoRemittanceDatabaseRepository,
} from '@zro/otc/infrastructure';

export type CreateCryptoRemittanceKafkaRequest =
  KafkaMessage<CreateCryptoRemittanceRequest>;

export type CreateCryptoRemittanceKafkaResponse =
  KafkaResponse<CreateCryptoRemittanceResponse>;

@Controller()
@MicroserviceController()
export class CreateCryptoRemittanceMicroserviceController {
  /**
   * Consumer of create cryptoRemittance.
   * @param cryptoRemittanceRepository CryptoRemittance repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CRYPTO_REMITTANCE.CREATE)
  async execute(
    @RepositoryParam(CryptoRemittanceDatabaseRepository)
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    @LoggerParam(CreateCryptoRemittanceMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateCryptoRemittanceRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateCryptoRemittanceKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateCryptoRemittanceRequest(message);

    // Create and call cryptoRemittance controller.
    const controller = new CreateCryptoRemittanceController(
      logger,
      cryptoRemittanceRepository,
    );

    // Call crypto remittance controller
    const cryptoRemittance = await controller.execute(payload);

    // Create crypto remittance
    logger.info('Crypto remittance created.', { cryptoRemittance });

    return {
      ctx,
      value: cryptoRemittance,
    };
  }
}
