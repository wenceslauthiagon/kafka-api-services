import { Logger } from 'winston';
import { Controller, Body, Post } from '@nestjs/common';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Public, RequestId, InjectLogger } from '@zro/common';
import { SendForgetPasswordServiceKafka } from '@zro/api-admin/infrastructure';
import { SendForgetPasswordResponse } from '@zro/admin/interface';

export class SendForgetPasswordBody {
  @ApiProperty({
    description: 'Admin email.',
    example: 'admin@zrobank.com.br',
  })
  @IsString()
  @MaxLength(255)
  @IsEmail()
  email: string;
}

/**
 * Admin controller. Controller is protected by JWT access token.
 */
@ApiTags('Admin')
@Public()
@Controller('forget-password')
export class SendForgetPasswordRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param send create microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly sendForgetPasswordKafkaService: SendForgetPasswordServiceKafka,
  ) {
    this.logger = logger.child({
      context: SendForgetPasswordRestController.name,
    });
  }

  /**
   * Get admin endpoint.
   */
  @ApiOperation({
    summary: 'Send forget password email for admin user.',
    description:
      'Able to send an forget password email with a verification code in it.',
  })
  @ApiOkResponse({
    description: 'The forget password email had been send successfully.',
    type: null,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  async execute(
    @RequestId() requestId: string,
    @Body() body: SendForgetPasswordBody,
  ): Promise<SendForgetPasswordResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Create a payload.
    const payload = {
      email: body.email,
    };

    logger.debug('Send forget email password.', { payload });

    // Call send forget password email service.
    const result = await this.sendForgetPasswordKafkaService.execute(
      requestId,
      payload,
    );

    logger.debug('Email send.', { result });

    return result;
  }
}
