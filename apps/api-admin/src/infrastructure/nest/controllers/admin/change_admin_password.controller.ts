import { Logger } from 'winston';
import { Controller, Body, Param, Patch } from '@nestjs/common';
import { IsString } from 'class-validator';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { InjectLogger, Public, RequestId } from '@zro/common';
import { ChangeAdminPasswordServiceKafka } from '@zro/api-admin/infrastructure';

export class ChangeAdminPasswordParams {
  @ApiProperty({
    description: 'Admin user id.',
    example: 1,
  })
  @IsString()
  id: string;
}

export class ChangeAdminPasswordBody {
  @ApiProperty({
    description: 'Admin Password.',
    example: 'new_pass',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Admin Confirm Password.',
    example: 'new_pass',
  })
  @IsString()
  confirm_password: string;

  @ApiProperty({
    description: 'Admin Verification Code.',
    example: '326646',
  })
  @IsString()
  verification_code: string;
}

/**
 * Admin controller. Controller is protected by JWT access token.
 */
@ApiTags('Admin')
@Public()
@Controller('change-password/:id')
export class ChangeAdminPasswordRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param send create microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly changeAdminPasswordKafkaService: ChangeAdminPasswordServiceKafka,
  ) {
    this.logger = logger.child({
      context: ChangeAdminPasswordRestController.name,
    });
  }

  /**
   * Get admin endpoint.
   */
  @ApiOperation({
    summary: 'Change password for admin user.',
    description: 'Enable to change admin password which was forgotten.',
  })
  @ApiOkResponse({
    description: 'The admin password had been changed successfully.',
    type: null,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Patch()
  async execute(
    @RequestId() requestId: string,
    @Body() body: ChangeAdminPasswordBody,
    @Param() params: ChangeAdminPasswordParams,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload = {
      id: parseInt(params.id),
      password: body.password,
      confirmPassword: body.confirm_password,
      verificationCode: body.verification_code,
    };

    logger.debug('Send change admin user password in execution.');

    // Call send forget password email service.
    await this.changeAdminPasswordKafkaService.execute(requestId, payload);

    logger.debug('Admin password has been changed.');
  }
}
