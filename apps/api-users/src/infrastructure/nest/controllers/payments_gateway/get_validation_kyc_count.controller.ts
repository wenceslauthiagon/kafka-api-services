import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsArray, IsOptional, IsString, Length } from 'class-validator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  LoggerParam,
  DefaultApiHeaders,
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
  KafkaServiceParam,
  HasPermission,
} from '@zro/common';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { GetValidationKycCountServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetValidationKycCountRequest,
  GetValidationKycCountResponseItem,
} from '@zro/payments-gateway/interface';

export class GetValidationKycCountParams {
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
    description: 'Filter by date range. Start from date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date start date',
  })
  @IsDateBeforeThan('created_end_date', true, {
    message: 'Created start date must be before than end date',
  })
  created_start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range. Filter until date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created end date',
  })
  @IsDateAfterThan('created_start_date', true, {
    message: 'Created end date must be after than created start date',
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

export class GetValidationKycCountRestResponse {
  @ApiProperty({
    description: 'Total Validation kyc count found.',
    example: 10,
  })
  total: number;

  constructor(props: GetValidationKycCountResponseItem) {
    this.total = props.total_items;
  }
}

/**
 * Get Validation Kyc Count Controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Kyc')
@Controller('payments-gateway/validation/kyc/count')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-kyc-count')
export class GetValidationKycCountRestController {
  /**
   * Validation kyc count endpoint.
   */
  @ApiOperation({
    summary: 'Validation kyc count.',
    description: 'Validation kyc count.',
  })
  @ApiOkResponse({
    description: 'The validation kyc count returned successfully.',
    type: GetValidationKycCountRestResponse,
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
    @Query() params: GetValidationKycCountParams,
    @KafkaServiceParam(GetValidationKycCountServiceKafka)
    service: GetValidationKycCountServiceKafka,
    @LoggerParam(GetValidationKycCountRestController)
    logger: Logger,
  ): Promise<GetValidationKycCountRestResponse> {
    // Creates a payload
    const payload: GetValidationKycCountRequest = {
      wallet_id: wallet.id,
      created_start_date: params.created_start_date,
      created_end_date: params.created_end_date,
      updated_start_date: params.updated_start_date,
      updated_end_date: params.updated_end_date,
      wallets: params.wallets,
    };

    logger.debug('Get validation kyc count.', {
      user,
      wallet,
      payload,
    });

    // Call validation kyc count service.
    const result = await service.execute(payload);

    logger.debug('Found validation kyc count.', { result });

    const response =
      result?.data.length &&
      new GetValidationKycCountRestResponse(result.data[0]);

    return response;
  }
}
