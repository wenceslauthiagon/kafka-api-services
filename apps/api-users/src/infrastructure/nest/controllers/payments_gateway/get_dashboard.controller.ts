import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
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
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetDashboardServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetDashboardResponse,
  GetDashboardRequest,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import { IsArray, IsOptional, IsString, Length } from 'class-validator';

export class GetDashboardParams {
  @ApiPropertyOptional({
    description: 'Page limit (ex.: 20).',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  limit?: string;

  @ApiPropertyOptional({
    description: 'Number of pages (ex.: 1)',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  page?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range. Start from date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
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
  @IsIsoStringDateFormat('YYYY-MM-DD', {
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
  @IsIsoStringDateFormat('YYYY-MM-DD', {
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
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'End date invalid format.',
  })
  @IsDateAfterThan('updated_start_date', true, {
    message: 'End date must be after start date.',
  })
  updated_end_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by wallets',
    example: ['wallet1', 'wallet2'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wallets: string[];
}

export class GetDashboardRestResponseItem {
  @ApiPropertyOptional({
    description: 'Type.',
    example: 'transaction',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Status.',
    example: 'pending',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Total items.',
    example: 17,
  })
  total_items?: number;

  @ApiPropertyOptional({
    description: 'Total value.',
    example: 26140,
  })
  total_value?: number;
}

export class GetDashboardRestResponse {
  @ApiProperty({
    description: 'Dashboard found.',
    example: [GetDashboardRestResponseItem],
  })
  data!: GetDashboardRestResponseItem[];

  constructor(props: GetDashboardResponse) {
    this.data = props.data;
  }
}

/**
 * GetDashboard controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Dashboard')
@Controller('payments-gateway/dashboard')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-dashboard')
export class GetDashboardRestController {
  /**
   * Get dashboard endpoint.
   */
  @ApiOperation({
    summary: 'List dashboard.',
    description:
      'Get a list of dashboard. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'Dashboard found successfully.',
    type: GetDashboardRestResponse,
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
    @Query() params: GetDashboardParams,
    @KafkaServiceParam(GetDashboardServiceKafka)
    service: GetDashboardServiceKafka,
    @LoggerParam(GetDashboardRestController)
    logger: Logger,
  ): Promise<GetDashboardRestResponse> {
    // Creates a payload
    const payload: GetDashboardRequest = {
      wallet_id: wallet.id,
      created_start_date: params.created_start_date,
      created_end_date: params.created_end_date,
      updated_start_date: params.updated_start_date,
      updated_end_date: params.updated_end_date,
      wallets: params.wallets,
    };

    logger.debug('Get dashboard.', { user, wallet, payload });

    const result = await service.execute(payload);

    logger.debug('Found dashboard.', { result });

    const response = result && new GetDashboardRestResponse(result);

    return response;
  }
}
