import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
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
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
  HasPermission,
} from '@zro/common';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetOrdersRefundsServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetOrdersRefundsRequest,
  GetOrdersRefundsResponse,
  TCompany,
  TTransaction,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { LinksRestReponse, MetaRestResponse } from './default';

export class GetOrdersRefundsParams {
  @ApiPropertyOptional({
    description: 'Page limit (ex.: 20).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  limit?: string;

  @ApiPropertyOptional({
    description: 'Number of pages (ex.: 1)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  page?: string;

  @ApiPropertyOptional({
    description: 'Filter by order ID.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  id?: string;

  @ApiPropertyOptional({
    description: 'Filter by company ID.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction ID.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment status.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  payment_status?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range. Start from date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Start date invalid format.',
  })
  @IsDateBeforeThan('created_end_date', true, {
    message: 'Start date must be before end date.',
  })
  created_start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range. Filter until date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'End date invalid format.',
  })
  @IsDateAfterThan('created_start_date', true, {
    message: 'End date must be after start date.',
  })
  created_end_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by last update date range. Filter from date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Start date invalid format.',
  })
  @IsDateBeforeThan('updated_end_date', true, {
    message: 'Start date must be before end date.',
  })
  updated_start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by last update date range. Filter until date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'End date invalid format.',
  })
  @IsDateAfterThan('created_start_date', true, {
    message: 'End date must be after start date.',
  })
  updated_end_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by status.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  status?: string;
}

export class GetOrdersRefundsRestResponseItem {
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
  total_value_shopkeeper_cents?: number;

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
}

export class GetOrdersRefundsRestResponse {
  @ApiProperty({
    description: 'Orders found.',
    example: [GetOrdersRefundsRestResponseItem],
  })
  data!: GetOrdersRefundsRestResponseItem[];

  @ApiProperty({
    description: 'Links.',
    example: LinksRestReponse,
  })
  links: LinksRestReponse;

  @ApiProperty({
    description: 'Meta.',
    example: MetaRestResponse,
  })
  meta: MetaRestResponse;

  constructor(props: GetOrdersRefundsResponse) {
    this.data = props.data;
    this.links = props.links;
    this.meta = props.meta;
  }
}

/**
 * GetOrders controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Orders | Refunds')
@Controller('payments-gateway/orders-refunds')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-orders-refunds')
export class GetOrdersRefundsRestController {
  /**
   * Get orders endpoint.
   */
  @ApiOperation({
    summary: 'List orders.',
    description:
      'Get a list of orders. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'Orders found successfully.',
    type: GetOrdersRefundsRestResponse,
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
    @Query() params: GetOrdersRefundsParams,
    @KafkaServiceParam(GetOrdersRefundsServiceKafka)
    service: GetOrdersRefundsServiceKafka,
    @LoggerParam(GetOrdersRefundsRestController)
    logger: Logger,
  ): Promise<GetOrdersRefundsRestResponse> {
    // Creates a payload
    const payload: GetOrdersRefundsRequest = {
      wallet_id: wallet.id,
      limit: params.limit,
      page: params.page,
      id: params.id,
      company_id: params.company_id,
      transaction_id: params.transaction_id,
      payment_status: params.payment_status,
      created_start_date: params.created_start_date,
      created_end_date: params.created_end_date,
      updated_start_date: params.updated_start_date,
      updated_end_date: params.updated_end_date,
      status: params.status,
    };

    logger.debug('Get orders refunds.', { user, wallet, payload });

    // Call orders service.
    const result = await service.execute(payload);

    logger.debug('Found orders refunds.', { result });

    const response = result && new GetOrdersRefundsRestResponse(result);

    return response;
  }
}
