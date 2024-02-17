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
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetConversionCreditByUserServiceKafka } from '@zro/otc/infrastructure';
import {
  GetConversionCreditByUserRequest,
  GetConversionCreditByUserResponse,
} from '@zro/otc/interface';

class GetConversionCreditByUserRestResponse {
  @ApiProperty({
    description:
      'Libability (Sum of all negative balances of all active currencies).',
    example: -1000,
  })
  liability!: number;

  @ApiProperty({
    description: 'Credit balance for user.',
    example: 10000,
  })
  credit_balance!: number;

  constructor(props: GetConversionCreditByUserResponse) {
    this.liability = props.liability;
    this.credit_balance = props.creditBalance;
  }
}

/**
 * User otc controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('conversions/credit-balance')
@HasPermission('api-paas-get-otc-conversions-credit-balance')
export class GetConversionCreditByUserRestController {
  /**
   * Create conversion endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: 'Conversions.',
    description: 'Get liability and credit balance conversion.',
  })
  @ApiOkResponse({
    description: 'Conversion credit success.',
    type: GetConversionCreditByUserRestResponse,
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
    @KafkaServiceParam(GetConversionCreditByUserServiceKafka)
    service: GetConversionCreditByUserServiceKafka,
    @LoggerParam(GetConversionCreditByUserRestController)
    logger: Logger,
  ): Promise<GetConversionCreditByUserRestResponse> {
    // Send a payload.
    const payload: GetConversionCreditByUserRequest = {
      userId: user.uuid,
    };

    logger.debug('Send get conversion credit.', { payload });

    // Call send get conversion credit service.
    const result = await service.execute(payload);

    logger.debug('Conversion credit sent.', result);

    const response = new GetConversionCreditByUserRestResponse(result);

    return response;
  }
}
