import { Controller, Get, Version } from '@nestjs/common';
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

class V2GetConversionCreditByUserRestResponse {
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
@Controller('otc/conversions/credit-balance')
@HasPermission('api-paas-get-otc-conversions-credit-balance')
export class V2GetConversionCreditByUserRestController {
  /**
   * Create conversion endpoint.
   */
  @ApiOperation({
    summary: "Get user's credit balance and liability.",
    description:
      "Get user's liability (the sum in BRL of all negative balances of all active currencies) and credit balance.",
  })
  @ApiOkResponse({
    description: 'Conversion credit success.',
    type: V2GetConversionCreditByUserRestResponse,
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
  @Version('2')
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(GetConversionCreditByUserServiceKafka)
    service: GetConversionCreditByUserServiceKafka,
    @LoggerParam(V2GetConversionCreditByUserRestController)
    logger: Logger,
  ): Promise<V2GetConversionCreditByUserRestResponse> {
    // Send a payload.
    const payload: GetConversionCreditByUserRequest = {
      userId: user.uuid,
    };

    logger.debug('Send get conversion credit.', { payload });

    // Call send get conversion credit service.
    const result = await service.execute(payload);

    logger.debug('Conversion credit sent.', result);

    const response = new V2GetConversionCreditByUserRestResponse(result);

    return response;
  }
}
