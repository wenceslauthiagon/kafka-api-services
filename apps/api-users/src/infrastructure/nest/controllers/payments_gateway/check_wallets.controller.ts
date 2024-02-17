import { Logger } from 'winston';
import { Body, Controller, Post } from '@nestjs/common';
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
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { CheckWalletsServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  CheckWalletsRequest,
  CheckWalletsResponse,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

export class CheckWalletsBody {
  @ApiProperty({
    description: 'Wallets ids to search.',
    example: ['e969a5ab-7665-41bb-b73e-741bcfd876bf'],
    isArray: true,
  })
  @Transform((params) =>
    Array.isArray(params.value) ? params.value : [params.value],
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  wallets_ids: string[];
}

export class CheckWalletsRestResponse {
  @ApiProperty({
    description: 'Wallets ids checked.',
    example: ['e969a5ab-7665-41bb-b73e-741bcfd876bf'],
    isArray: true,
  })
  data!: string[];

  constructor(props: CheckWalletsResponse) {
    this.data = props.data;
  }
}

/**
 * Check Wallets controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Wallets')
@Controller('payments-gateway/check-wallets')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-post-payments-gateway-check-wallets')
export class CheckWalletsRestController {
  /**
   * Check wallets endpoint.
   */
  @ApiOperation({
    summary: 'Check wallets.',
    description:
      'Check a list of wallets. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'Wallets found successfully.',
    type: CheckWalletsRestResponse,
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
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Body() body: CheckWalletsBody,
    @KafkaServiceParam(CheckWalletsServiceKafka)
    service: CheckWalletsServiceKafka,
    @LoggerParam(CheckWalletsRestController)
    logger: Logger,
  ): Promise<CheckWalletsRestResponse> {
    // Creates a payload
    const payload: CheckWalletsRequest = {
      wallets_ids: body.wallets_ids,
    };

    logger.debug('Check wallets.', { user, wallet, payload });

    // Call wallets service.
    const result = await service.execute(payload);

    logger.debug('Found wallets.', { result });

    const response = result && new CheckWalletsRestResponse(result);

    return response;
  }
}
