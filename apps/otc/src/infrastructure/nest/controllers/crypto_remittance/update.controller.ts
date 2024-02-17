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
  UpdateCryptoRemittanceResponse,
  UpdateCryptoRemittanceController,
  UpdateCryptoRemittanceRequest,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CryptoRemittanceDatabaseRepository,
} from '@zro/otc/infrastructure';

export type UpdateCryptoRemittanceKafkaRequest =
  KafkaMessage<UpdateCryptoRemittanceRequest>;

export type UpdateCryptoRemittanceKafkaResponse =
  KafkaResponse<UpdateCryptoRemittanceResponse>;

@Controller()
@MicroserviceController()
export class UpdateCryptoRemittanceMicroserviceController {
  /**
   * Consumer of update cryptoRemittance.
   * @param cryptoRemittanceRepository CryptoRemittance repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CRYPTO_REMITTANCE.UPDATE)
  async execute(
    @RepositoryParam(CryptoRemittanceDatabaseRepository)
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    @LoggerParam(UpdateCryptoRemittanceMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateCryptoRemittanceRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateCryptoRemittanceKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateCryptoRemittanceRequest(message);

    // Update and call cryptoRemittance controller.
    const controller = new UpdateCryptoRemittanceController(
      logger,
      cryptoRemittanceRepository,
    );

    // Call crypto remittance controller
    const cryptoRemittance = await controller.execute(payload);

    // Update crypto remittance
    logger.info('Crypto remittance updated.', { cryptoRemittance });

    return {
      ctx,
      value: cryptoRemittance,
    };
  }
}
