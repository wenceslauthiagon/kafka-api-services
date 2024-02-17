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
  GetSystemByNameController,
  GetSystemByNameRequest,
  GetSystemByNameResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  SystemDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetSystemByNameKafkaRequest = KafkaMessage<GetSystemByNameRequest>;

export type GetSystemByNameKafkaResponse =
  KafkaResponse<GetSystemByNameResponse>;

/**
 * System controller.
 */
@Controller()
@MicroserviceController()
export class GetSystemByNameMicroserviceController {
  /**
   * Consumer of get by system name.
   *
   * @param systemRepository System repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SYSTEM.GET_BY_NAME)
  async execute(
    @RepositoryParam(SystemDatabaseRepository)
    systemRepository: SystemRepository,
    @LoggerParam(GetSystemByNameMicroserviceController) logger: Logger,
    @Payload('value') message: GetSystemByNameRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetSystemByNameKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetSystemByNameRequest(message);

    // Create and call get system by name controller.
    const controller = new GetSystemByNameController(logger, systemRepository);

    const system = await controller.execute(payload);

    logger.info('System found.', { system });

    return {
      ctx,
      value: system,
    };
  }
}
