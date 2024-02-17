import { Controller, Get, Param } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { Logger } from 'winston';
import { Throttle } from '@nestjs/throttler';
import {
  ApiProperty,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  Public,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
} from '@zro/common';
import { SendConfirmCodeServiceKafka } from '@zro/signup/infrastructure';
import { SendConfirmCodeSignupRequest } from '@zro/signup/interface';

class SendConfirmCodeParams {
  @ApiProperty({
    description: 'Signup ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

/**
 * Send code auth controller.
 */
@ApiTags('Signup')
@Public()
@DefaultApiHeaders()
@Controller('signup/:id/code')
export class SendConfirmCodeRestController {
  /**
   * Get auth verification code endpoint.
   */
  @ApiOperation({
    summary: 'Send confirmation code by email.',
    description:
      'Generates a new 5-digit code and sends it via email to the user for the purpose of verifying their account.',
  })
  @ApiOkResponse({
    description: 'Code sent successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  @Throttle(1, 60)
  async execute(
    @KafkaServiceParam(SendConfirmCodeServiceKafka)
    service: SendConfirmCodeServiceKafka,
    @LoggerParam(SendConfirmCodeRestController)
    logger: Logger,
    @Param() params: SendConfirmCodeParams,
  ): Promise<void> {
    // Create a payload.
    const payload: SendConfirmCodeSignupRequest = {
      id: params.id,
    };

    logger.debug('Send confirm verification code.', { payload });

    // Call send code service.
    await service.execute(payload);

    logger.debug('Confirm code sent.');
  }
}
