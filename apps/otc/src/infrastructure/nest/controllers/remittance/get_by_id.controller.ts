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
import { RemittanceRepository } from '@zro/otc/domain';
import {
  GetRemittanceByIdController,
  GetRemittanceByIdRequest,
  GetRemittanceByIdResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  RemittanceDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetRemittanceByIdKafkaRequest =
  KafkaMessage<GetRemittanceByIdRequest>;

export type GetRemittanceByIdKafkaResponse =
  KafkaResponse<GetRemittanceByIdResponse>;

@Controller()
@MicroserviceController()
export class GetRemittanceByIdMicroserviceController {
  /**
   * Consumer of getById Remittance.
   * @param remittanceRepository Remittance repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE.GET_BY_ID)
  async execute(
    @RepositoryParam(RemittanceDatabaseRepository)
    remittanceRepository: RemittanceRepository,
    @LoggerParam(GetRemittanceByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetRemittanceByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetRemittanceByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetRemittanceByIdRequest(message);

    // GetById and call remittance controller.
    const controller = new GetRemittanceByIdController(
      logger,
      remittanceRepository,
    );

    // Call remittance controller
    const remittance = await controller.execute(payload);

    // GetById remittance
    logger.info('Getting remittance by id.', { remittance });

    return {
      ctx,
      value: remittance,
    };
  }
}
