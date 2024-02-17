import { Controller, Get } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import {
  AuthUserParam,
  GetUserHasPinServiceKafka,
} from '@zro/users/infrastructure';
import {
  GetUserHasPinRequest,
  GetUserHasPinResponse,
} from '@zro/users/interface';

class GetUserHasPinRestResponse {
  @ApiProperty({
    description: 'Check if user has pin.',
    example: true,
  })
  has_pin!: boolean;

  constructor(props: GetUserHasPinResponse) {
    this.has_pin = props.hasPin;
  }
}

/**
 * User controller. Controller is protected by JWT access token.
 */
@ApiTags('Users')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('users/has-pin')
@HasPermission('api-users-get-user-has-pin')
export class GetUserHasPinRestController {
  /**
   * Create usersTed endpoint.
   */
  @ApiOperation({
    summary: 'Get user has pin.',
    description: 'Check if user has pin created.',
  })
  @ApiOkResponse({
    description: 'Users pin checked.',
    type: GetUserHasPinRestResponse,
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
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(GetUserHasPinServiceKafka)
    service: GetUserHasPinServiceKafka,
    @LoggerParam(GetUserHasPinRestController)
    logger: Logger,
  ): Promise<GetUserHasPinRestResponse> {
    // Send a payload.
    const payload: GetUserHasPinRequest = {
      uuid: user.uuid,
    };

    logger.debug('Send check user has pin.', { payload });

    // Call send service.
    const result = await service.execute(payload);

    logger.debug('Check user has pin sent.', { result });

    const response = new GetUserHasPinRestResponse(result);

    return response;
  }
}
