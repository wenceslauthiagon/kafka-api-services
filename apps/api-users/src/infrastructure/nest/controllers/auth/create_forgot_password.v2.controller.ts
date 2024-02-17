import {
  Controller,
  Post,
  UseGuards,
  Logger,
  Body,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiProperty,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Public,
  DefaultApiHeaders,
  LoggerParam,
  KafkaServiceParam,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { RecaptchaGuard, RecaptchaBody } from '@zro/api-users/infrastructure';
import { CreateUserForgotPasswordByEmailServiceKafka } from '@zro/users/infrastructure';
import { IsEmail } from 'class-validator';

class V2ForgotPasswordRestRequest extends RecaptchaBody {
  @ApiProperty({
    description: 'User email.',
    example: 'email@teste.com',
  })
  @IsEmail()
  email: string;

  constructor(props: V2ForgotPasswordRestRequest) {
    super(props);
  }
}

/**
 * Forgot password response DTO.
 */
class V2ForgotPasswordRestResponse {
  @ApiProperty({
    description: 'Forgot password id.',
  })
  id!: string;

  constructor(props: any) {
    this.id = props.id;
  }
}

/**
 * User forgot password controller.
 */
@ApiTags('Authentication')
@Public()
@DefaultApiHeaders()
@TransactionApiHeader()
@Controller('auth/forgot-password')
@UseGuards(RecaptchaGuard)
export class V2ForgotPasswordRestController {
  /**
   * User forgot password endpoint.
   */
  @ApiOperation({
    summary: 'Forgot password.',
    description:
      'Generates a new 5-digit code and sends it via email to the user for the purpose of verifying their account.',
  })
  @ApiCreatedResponse({
    description: 'User forgot password requires email.',
    type: V2ForgotPasswordRestRequest,
  })
  @ApiOkResponse({
    description: 'User forgot password successfully.',
    type: V2ForgotPasswordRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User forgot password failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Version('2')
  @Post()
  @Throttle(1, 60)
  async execute(
    @Body() body: V2ForgotPasswordRestRequest,
    @KafkaServiceParam(CreateUserForgotPasswordByEmailServiceKafka)
    service: CreateUserForgotPasswordByEmailServiceKafka,
    @LoggerParam(V2ForgotPasswordRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<V2ForgotPasswordRestResponse> {
    const payload = {
      id: transactionId,
      email: body.email,
    };

    logger.debug('User forgot password.', { payload });

    // Generate access token to authenticated user.
    const forgotPassword = await service.execute(payload);

    logger.debug('User forgot password created.', { forgotPassword });

    return forgotPassword && new V2ForgotPasswordRestResponse(forgotPassword);
  }
}
