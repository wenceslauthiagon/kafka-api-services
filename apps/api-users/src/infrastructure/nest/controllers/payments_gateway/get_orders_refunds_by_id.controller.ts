import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetOrdersRefundsByIdServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetOrderRefundsByIdResponse,
  GetOrderRefundsByIdRequest,
  TCompany,
  TTransaction,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthWallet } from '@zro/operations/domain';

export class GetOrderRefundsByIdParams {
  @ApiProperty({
    description: 'Order ID.',
  })
  @IsPositive()
  @Transform((params) => params && parseInt(params.value))
  id: number;
}

export class GetOrderRefundsByIdRestResponse {
  @ApiProperty({
    description: 'Order ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Order cents value.',
    example: 100,
  })
  value_cents: number;

  @ApiPropertyOptional({
    description: 'Order percent fee.',
    example: '0.5',
  })
  fee_in_percent?: string;

  @ApiProperty({
    description: 'Order company ID.',
    example: 2,
  })
  company_id: number;

  @ApiProperty({
    description: 'Order transaction ID.',
    example: 411,
  })
  transaction_id: number;

  @ApiPropertyOptional({
    description: 'Order shopkeeper total cents value.',
    example: 8900,
  })
  total_value_shopkeeper_cents: number;

  @ApiProperty({
    description: 'Order payment status.',
    example: 'paid',
  })
  payment_status: string;

  @ApiProperty({
    description: 'Order creation date.',
    example: '2022-12-07T20:05:17+00:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Order last update date.',
    example: '2022-12-07T20:05:17+00:00',
  })
  updated_at: string;

  @ApiPropertyOptional({
    description: 'Order company.',
    example: '2022-12-07T20:05:17+00:00',
  })
  company?: TCompany;

  @ApiPropertyOptional({
    description: 'Order transaction.',
    example: '2022-12-07T20:05:17+00:00',
  })
  transaction?: TTransaction;

  constructor(props: GetOrderRefundsByIdResponse) {
    this.id = props.id;
    this.value_cents = props.value_cents;
    this.fee_in_percent = props.fee_in_percent;
    this.company_id = props.company_id;
    this.transaction_id = props.transaction_id;
    this.total_value_shopkeeper_cents = props.total_value_shopkeeper_cents;
    this.payment_status = props.payment_status;
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;
    this.company = props.company;
    this.transaction = props.transaction;
  }
}

/**
 * GetOrderRefundsById controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Orders | Refunds')
@Controller('payments-gateway/orders-refunds/:id')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-orders-refunds-by-id')
export class GetOrderRefundsByIdRestController {
  /**
   * Get order by id endpoint.
   */
  @ApiOperation({
    summary: 'Get order by ID.',
    description:
      "Enter the order's ID below and execute to get its information.",
  })
  @ApiOkResponse({
    description: 'OrderRefundsById found successfully.',
    type: GetOrderRefundsByIdRestResponse,
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
    @AuthWalletParam() wallet: AuthWallet,
    @Param() params: GetOrderRefundsByIdParams,
    @KafkaServiceParam(GetOrdersRefundsByIdServiceKafka)
    service: GetOrdersRefundsByIdServiceKafka,
    @LoggerParam(GetOrderRefundsByIdRestController)
    logger: Logger,
  ): Promise<GetOrderRefundsByIdRestResponse> {
    // Creates a payload
    const payload: GetOrderRefundsByIdRequest = {
      wallet_id: wallet.id,
      id: params.id,
    };

    logger.debug('Get order by id.', { user, wallet, payload });

    // Call devolution by id service.
    const result = await service.execute(payload);

    logger.debug('Found order.', { result });

    const response = result && new GetOrderRefundsByIdRestResponse(result);

    return response;
  }
}
