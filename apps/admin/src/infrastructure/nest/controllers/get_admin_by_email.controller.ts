import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import { IsEmail, MaxLength } from 'class-validator';
import {
  InjectValidator,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  GetAdminByEmailController,
  GetAdminByEmailRequest,
  GetAdminByEmailResponse,
} from '@zro/admin/interface';
import {
  KAFKA_TOPICS,
  AdminDatabaseRepository,
} from '@zro/admin/infrastructure';

export class GetAdminByEmailRequestDto implements GetAdminByEmailRequest {
  @IsEmail()
  @MaxLength(255)
  email: string;

  constructor(props: GetAdminByEmailRequest) {
    Object.assign(this, props);
  }
}

export type GetAdminByEmailResponseDto = GetAdminByEmailResponse;

export type GetAdminByEmailKafkaRequest =
  KafkaMessage<GetAdminByEmailRequestDto>;

export type GetAdminByEmailKafkaResponse =
  KafkaResponse<GetAdminByEmailResponseDto>;

/**
 * Admin RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetAdminByEmailMicroserviceController {
  /**
   * Default admin RPC controller constructor.
   *
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of get admin by phone number.
   *
   * @param adminRepository Admin repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN.GET_BY_EMAIL)
  async execute(
    @RepositoryParam(AdminDatabaseRepository)
    adminRepository: AdminRepository,
    @LoggerParam(GetAdminByEmailMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAdminByEmailRequestDto,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAdminByEmailKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAdminByEmailRequestDto(message);
    await this.validate(payload);

    logger.info('Getting admin.', { payload });

    // Create and call get admin by phone number controller.
    const controller = new GetAdminByEmailController(logger, adminRepository);

    // Get admin
    const admin = await controller.execute(payload);

    logger.info('Admin found.', { admin });

    return {
      ctx,
      value: admin,
    };
  }
}
