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
import { GetWithdrawalsServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetWithdrawalsRequest,
  GetWithdrawalsResponse,
  Order,
  TBank,
  TClient,
  TCompany,
  TKyc,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import {
  ErrorDescriptionRestResponse,
  LinksRestReponse,
  MetaRestResponse,
} from './default';

export class GetWithdrawalsParams {
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
    description: 'Filter by withdrawal ID.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  id?: string;

  @ApiPropertyOptional({
    description: 'Ordenation.',
    enum: Order,
  })
  @IsOptional()
  @IsEnum(Order)
  order?: Order;

  @ApiPropertyOptional({
    description: 'Filter by field.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  field?: string;

  @ApiPropertyOptional({
    description: 'Filter by client name.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  client_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by client document.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  client_document?: string;

  @ApiPropertyOptional({
    description: 'Filter by client email.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  client_email?: string;

  @ApiPropertyOptional({
    description: 'Filter by bank reference.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  bank_reference?: string;

  @ApiPropertyOptional({
    description: 'Filter by instant payment ID.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  instant_payment_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by PIX key type.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  type_key_pix?: string;

  @ApiPropertyOptional({
    description: 'Filter by PIX key.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  key_pix?: string;

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
  @IsDateAfterThan('updated_start_date', true, {
    message: 'End date must be after start date.',
  })
  updated_end_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by status.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by company ID.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by bank name.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  bank_name?: string;

  @ApiPropertyOptional({
    description: 'End to end ID.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  end_to_end_id_field?: string;

  @ApiPropertyOptional({
    description: 'Filter by merchant ID.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  merchant_id?: string;
}

export class GetWithdrawalByIdRestResponseItem {
  @ApiPropertyOptional({
    description: 'Withdrawal ID.',
    example: 1,
  })
  id?: number;

  @ApiProperty({
    description: 'Process status.',
    examples: ['waiting', 'completed', 'failed'],
  })
  process_status?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal reference.',
    example: '99b22dde-a97d-11ed-afa1-0242ac120002',
  })
  reference?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal main transaction.',
    example: 'acc662aa-9f3b-445f-813d-bcb50e3abbdb',
  })
  main_transaction?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal UUID.',
    example: 'acc662aa-9f3b-445f-813d-bcb50e3abbdb',
  })
  uuid?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal description.',
    example: 'Teste',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal payment type.',
    example: 'pix',
  })
  payment_type?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal status.',
    example: 'pending',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal PIX key type.',
    example: 'EVP',
  })
  type_key_pix?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal PIX key.',
    example: '066cf2db-0f74-4d02-99b9-a4e695c6a10a',
  })
  key_pix?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal fee value.',
    example: '0,00',
  })
  fee_value?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal value.',
    example: '1,99',
  })
  value?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal creation date.',
    example: '2022-12-07T20:05:17+00:00',
  })
  created_at?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal last update.',
    example: '2022-12-07T20:05:17+00:00',
  })
  updated_at?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal transaction type.',
    example: 'returned',
  })
  transaction_type?: string;

  @ApiPropertyOptional({
    description: 'End to end ID.',
    example: 'E45246410202302032028B8igHrRQcRj',
  })
  end_to_end_id_field?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal PSP bank name.',
    example: 'Banco psp',
  })
  psp_bank_name?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal PSP bank ISPB.',
    example: '111111',
  })
  psp_ispb?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal company ID.',
    example: 1,
  })
  company_id?: number;

  @ApiPropertyOptional({
    description: 'Withdrawal instant payment ID field.',
    example: 2,
  })
  instant_payment_id_field?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal error description.',
    example: ErrorDescriptionRestResponse,
  })
  error_description?: ErrorDescriptionRestResponse;

  @ApiPropertyOptional({
    description: 'Withdrawal client.',
    example: null,
  })
  client?: TClient;

  @ApiPropertyOptional({
    description: 'Withdrawal bank.',
    example: null,
  })
  bank?: TBank;

  @ApiPropertyOptional({
    description: 'Withdrawal company.',
    example: null,
  })
  company?: TCompany;

  @ApiPropertyOptional()
  kyc?: TKyc;
}

export class GetWithdrawalsRestResponse {
  @ApiProperty({
    description: 'Withdrawals found.',
    example: [GetWithdrawalByIdRestResponseItem],
  })
  data!: GetWithdrawalByIdRestResponseItem[];

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

  constructor(props: GetWithdrawalsResponse) {
    this.data = props.data;
    this.links = props.links;
    this.meta = props.meta;
  }
}

/**
 * GetWithdrawals controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Withdrawals')
@Controller('payments-gateway/withdrawals')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-withdrawals')
export class GetWithdrawalsRestController {
  /**
   * Get withdrawals endpoint.
   */
  @ApiOperation({
    summary: 'List withdrawals.',
    description:
      'Get a list of withdrawals. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'Withdrawals found successfully.',
    type: GetWithdrawalsRestResponse,
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
    @Query() params: GetWithdrawalsParams,
    @KafkaServiceParam(GetWithdrawalsServiceKafka)
    service: GetWithdrawalsServiceKafka,
    @LoggerParam(GetWithdrawalsRestController)
    logger: Logger,
  ): Promise<GetWithdrawalsRestResponse> {
    // Creates a payload
    const payload: GetWithdrawalsRequest = {
      wallet_id: wallet.id,
      limit: params.limit,
      page: params.page,
      id: params.id,
      order: params.order,
      field: params.field,
      client_name: params.client_name,
      client_document: params.client_document,
      client_email: params.client_email,
      bank_reference: params.bank_reference,
      instant_payment_id: params.instant_payment_id,
      type_key_pix: params.type_key_pix,
      key_pix: params.key_pix,
      created_start_date: params.created_start_date,
      created_end_date: params.created_end_date,
      updated_start_date: params.updated_start_date,
      updated_end_date: params.updated_end_date,
      status: params.status,
      company_id: params.company_id,
      bank_name: params.bank_name,
      end_to_end: params.end_to_end_id_field,
      merchant_id: params.merchant_id,
    };

    logger.debug('Get withdrawals.', { user, wallet, payload });

    // Call withdrawals service.
    const result = await service.execute(payload);

    logger.debug('Found withdrawals.', { result });

    const response = result && new GetWithdrawalsRestResponse(result);

    return response;
  }
}
