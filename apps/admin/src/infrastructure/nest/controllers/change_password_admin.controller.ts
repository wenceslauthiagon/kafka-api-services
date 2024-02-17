import { IsInt, IsString, MaxLength } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  InjectValidator,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
  BcryptHashService,
  KafkaMessagePattern,
} from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  KAFKA_TOPICS,
  AdminDatabaseRepository,
} from '@zro/admin/infrastructure';
import {
  ChangeAdminPasswordController,
  ChangeAdminPasswordRequest,
} from '@zro/admin/interface';

export class ChangeAdminPasswordRequestDto
  implements ChangeAdminPasswordRequest
{
  @IsInt()
  id: number;

  @IsString()
  @MaxLength(255)
  password: string;

  @IsString()
  @MaxLength(255)
  confirmPassword: string;

  @IsString()
  @MaxLength(255)
  verificationCode: string;

  constructor(props: ChangeAdminPasswordRequest) {
    Object.assign(this, props);
  }
}

export type ChangeAdminPasswordKafkaRequest =
  KafkaMessage<ChangeAdminPasswordRequestDto>;

/**
 * Admin controller.
 */
@Controller()
@MicroserviceController()
export class ChangeAdminPasswordMicroserviceController {
  /**
   * Default admin RPC controller constructor.
   */

  constructor(
    @InjectValidator() private validate: Validator,
    private hashProvider: BcryptHashService,
  ) {}

  /**
   * Consumer of send Admin verification code.
   *
   * @param adminRepository Admin repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN.CHANGE_ADMIN_PASSWORD)
  async execute(
    @RepositoryParam(AdminDatabaseRepository)
    adminRepository: AdminRepository,
    @LoggerParam(ChangeAdminPasswordMicroserviceController) logger: Logger,
    @Payload('value') message: ChangeAdminPasswordRequestDto,
  ): Promise<void> {
    logger.debug('Received message for change password.');

    // Parse kafka message.
    const payload = new ChangeAdminPasswordRequestDto(message);
    await this.validate(payload);

    logger.info('Validation of payload done.');

    // Create and call send code controller.
    const controller = new ChangeAdminPasswordController(
      logger,
      adminRepository,
      this.hashProvider,
    );

    // Send forget password email with verification code.
    await controller.execute(payload);

    logger.info('Change password request sent.');
  }
}
