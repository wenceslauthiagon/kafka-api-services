import { Controller, Post, UseGuards, Logger, Body } from '@nestjs/common';
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
  IsMobilePhone,
  DefaultApiHeaders,
  LoggerParam,
  KafkaServiceParam,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { RecaptchaGuard, RecaptchaBody } from '@zro/api-users/infrastructure';
import { CreateUserForgotPasswordBySmsServiceKafka } from '@zro/users/infrastructure';

class ForgotPasswordRestRequest extends RecaptchaBody {
  @ApiProperty({
    description: 'User phone number.',
    example: '+5581912345678',
  })
  @IsMobilePhone()
  phone_number!: string;

  constructor(props: ForgotPasswordRestRequest) {
    super(props);
  }
}

/**
 * Forgot password response DTO.
 */
class ForgotPasswordRestResponse {
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
export class ForgotPasswordRestController {
  /**
   * User forgot password endpoint.
   */
  @ApiOperation({
    summary: 'Forgot password.',
    description: 'User that forgot password should provider your phone number.',
    deprecated: true,
  })
  @ApiCreatedResponse({
    description: 'User forgot password requires phone number.',
    type: ForgotPasswordRestRequest,
  })
  @ApiOkResponse({
    description: 'User forgot password successfully.',
    type: ForgotPasswordRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User forgot password failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  @Throttle(1, 60)
  async execute(
    @Body() body: ForgotPasswordRestRequest,
    @KafkaServiceParam(CreateUserForgotPasswordBySmsServiceKafka)
    service: CreateUserForgotPasswordBySmsServiceKafka,
    @LoggerParam(ForgotPasswordRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
  ): Promise<ForgotPasswordRestResponse> {
    const payload = {
      id: transactionId,
      phoneNumber: body.phone_number.replace(/\+/, ''),
    };

    logger.debug('User forgot password.', { payload });

    // Generate access token to authenticated user.
    const forgotPassword = await service.execute(payload);

    logger.debug('User forgot password created.', { forgotPassword });

    return forgotPassword && new ForgotPasswordRestResponse(forgotPassword);
  }
}
