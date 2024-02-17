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
  GetCryptoRemittanceByIdResponse,
  GetCryptoRemittanceByIdController,
  GetCryptoRemittanceByIdRequest,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CryptoRemittanceDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetCryptoRemittanceByIdKafkaRequest =
  KafkaMessage<GetCryptoRemittanceByIdRequest>;

export type GetCryptoRemittanceByIdKafkaResponse =
  KafkaResponse<GetCryptoRemittanceByIdResponse>;

@Controller()
@MicroserviceController()
export class GetCryptoRemittanceByIdMicroserviceController {
  /**
   * Consumer of getById cryptoRemittance.
   * @param cryptoRemittanceRepository CryptoRemittance repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CRYPTO_REMITTANCE.GET_BY_ID)
  async execute(
    @RepositoryParam(CryptoRemittanceDatabaseRepository)
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    @LoggerParam(GetCryptoRemittanceByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetCryptoRemittanceByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCryptoRemittanceByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCryptoRemittanceByIdRequest(message);

    // GetById and call cryptoRemittance controller.
    const controller = new GetCryptoRemittanceByIdController(
      logger,
      cryptoRemittanceRepository,
    );

    // Call crypto remittance controller
    const cryptoRemittance = await controller.execute(payload);

    // GetById crypto remittance
    logger.info('Getting crypto remittance by id.', { cryptoRemittance });

    return {
      ctx,
      value: cryptoRemittance,
    };
  }
}
