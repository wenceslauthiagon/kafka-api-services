import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  GetAdminByIdResponse,
  GetAdminByIdController,
  GetAdminByIdRequest,
} from '@zro/admin/interface';
import {
  KAFKA_TOPICS,
  AdminDatabaseRepository,
} from '@zro/admin/infrastructure';

export type GetAdminByIdResponseDto = GetAdminByIdResponse;

export type GetAdminByIdKafkaRequest = KafkaMessage<GetAdminByIdRequest>;

export type GetAdminByIdKafkaResponse = KafkaMessage<GetAdminByIdResponse>;

/**
 * Admin RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetAdminByIdMicroserviceController {
  /**
   * Consumer of get admin by id.
   *
   * @param adminRepository Admin repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN.GET_BY_ID)
  async execute(
    @RepositoryParam(AdminDatabaseRepository)
    adminRepository: AdminRepository,
    @LoggerParam(GetAdminByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAdminByIdKafkaRequest,
  ): Promise<GetAdminByIdKafkaResponse> {
    logger.debug('Received message.', { value: message.value });

    const payload = new GetAdminByIdRequest(message.value);

    logger.info('Getting admin.', { payload });

    const controller = new GetAdminByIdController(logger, adminRepository);

    const admin = await controller.execute(payload);

    logger.info('Admin found.', { admin });

    return {
      key: message.key,
      value: admin,
      headers: message.headers,
    };
  }
}
