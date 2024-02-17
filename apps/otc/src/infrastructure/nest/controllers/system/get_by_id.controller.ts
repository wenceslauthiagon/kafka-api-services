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
import { SystemRepository } from '@zro/otc/domain';
import {
  GetSystemByIdController,
  GetSystemByIdRequest,
  GetSystemByIdResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  SystemDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetSystemByIdKafkaRequest = KafkaMessage<GetSystemByIdRequest>;

export type GetSystemByIdKafkaResponse = KafkaResponse<GetSystemByIdResponse>;

/**
 * System controller.
 */
@Controller()
@MicroserviceController()
export class GetSystemByIdMicroserviceController {
  /**
   * Consumer of get by system id.
   *
   * @param systemRepository System repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SYSTEM.GET_BY_ID)
  async execute(
    @RepositoryParam(SystemDatabaseRepository)
    systemRepository: SystemRepository,
    @LoggerParam(GetSystemByIdMicroserviceController) logger: Logger,
    @Payload('value') message: GetSystemByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetSystemByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetSystemByIdRequest(message);

    // Create and call get system by id controller.
    const controller = new GetSystemByIdController(logger, systemRepository);

    const system = await controller.execute(payload);

    logger.info('System found.', { system });

    return {
      ctx,
      value: system,
    };
  }
}
