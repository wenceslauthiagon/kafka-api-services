import { Logger } from 'winston';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsEnum,
  IsUUID,
  IsPositive,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Controller, Get, Query } from '@nestjs/common';
import {
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  IsIsoStringDateFormat,
  Sort,
  IsDateBeforeThan,
  IsSmallerThan,
  IsBiggestThan,
  IsDateAfterThan,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  RemittanceStatus,
  RemittanceSide,
  System,
  Provider,
} from '@zro/otc/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetAllRemittanceServiceKafka } from '@zro/otc/infrastructure';
import {
  GetAllRemittanceRequest,
  GetAllRemittanceSort,
  GetAllRemittanceResponse,
  GetAllRemittanceResponseItem,
} from '@zro/otc/interface';

class GetAllRemittanceParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllRemittanceSort,
  })
  @IsOptional()
  @Sort(GetAllRemittanceSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsUUID(4)
  @ApiPropertyOptional({
    description: 'Remittance order ID.',
  })
  order_id?: string;

  @ApiPropertyOptional({
    description: 'Remittance status.',
    enum: RemittanceStatus,
  })
  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @ApiPropertyOptional({
    description: 'Remittance contract ID.',
  })
  @IsOptional()
  @IsUUID(4)
  contract_id?: string;

  @ApiPropertyOptional({
    description: 'Remittance provider ID.',
  })
  @IsOptional()
  @IsUUID(4)
  provider_id?: string;

  @ApiPropertyOptional({
    description: 'Remittance system ID.',
  })
  @IsOptional()
  @IsString()
  system_id?: string;

  @ApiPropertyOptional({
    description: 'Remittance side.',
    enum: RemittanceSide,
  })
  @IsOptional()
  @IsEnum(RemittanceSide)
  side?: RemittanceSide;

  @ApiPropertyOptional({
    description: 'Remittance concomitant.',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(
    (params) => (params && params.value === 'true') || params.value === true,
  )
  is_concomitant?: boolean;

  @ApiPropertyOptional({
    description: 'Remittance amount start.',
  })
  @IsOptional()
  @IsPositive()
  @IsSmallerThan('amount_end', true, {
    message: 'amount_start must be smaller than amount_end',
  })
  @Transform((params) => params && parseInt(params.value))
  amount_start?: number;

  @ApiPropertyOptional({
    description: 'Remittance amount end.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('amount_start', true, {
    message: 'amount_end must be biggest than amount_start',
  })
  @Transform((params) => params && parseInt(params.value))
  amount_end?: number;

  @ApiPropertyOptional({
    description: 'Remittance result start.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsSmallerThan('result_amount_end', true, {
    message: 'result_amount_start must be smaller than result_amount_end',
  })
  @Transform((params) => params && parseInt(params.value))
  result_amount_start?: number;

  @ApiPropertyOptional({
    description: 'Remittance result end.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('result_amount_start', true, {
    message: 'result_amount_end must be biggest than result_amount_start',
  })
  @Transform((params) => params && parseInt(params.value))
  result_amount_end?: number;

  @ApiPropertyOptional({
    description: 'Remittance quotation start.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsSmallerThan('bank_quote_end', true, {
    message: 'bank_quote_start must be smaller than bank_quote_end',
  })
  @Transform((params) => params && parseInt(params.value))
  bank_quote_start?: number;

  @ApiPropertyOptional({
    description: 'Remittance quotation end.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('bank_quote_start', true, {
    message: 'bank_quote_end must be biggest than bank_quote_start',
  })
  @Transform((params) => params && parseInt(params.value))
  bank_quote_end?: number;

  @ApiPropertyOptional({
    description: 'Remittance created at start.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_start',
  })
  @IsDateBeforeThan('created_at_end', false, {
    message: 'created_at_start must be before than created_at_end',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Remittance created at end.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_end',
  })
  @IsDateAfterThan('created_at_start', false, {
    message: 'created_at_end must be after than created_at_start',
  })
  created_at_end?: Date;

  @ApiPropertyOptional({
    description: 'Remittance updated at start.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated_at_start',
  })
  @IsDateBeforeThan('updated_at_end', false, {
    message: 'updated_at_start must be before than updated_at_end',
  })
  updated_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Remittance updated at end.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated_at_end',
  })
  @IsDateAfterThan('updated_at_start', false, {
    message: 'updated_at_end must be after than updated_at_start',
  })
  updated_at_end?: Date;
}

class GetAllRemittanceRestResponseItem {
  @ApiProperty({
    description: 'Remittance ID.',
    example: '195564a9-c5fd-4e73-9abb-72e0383f2dff',
  })
  id: string;

  @ApiProperty({
    description: 'Provider.',
  })
  provider: Provider;

  @ApiProperty({
    description: 'Status.',
    enum: RemittanceStatus,
    example: RemittanceStatus.CLOSED,
  })
  status: RemittanceStatus;

  @ApiProperty({
    description: 'Amount.',
    example: 5000,
  })
  amount: number;

  @ApiProperty({
    description: 'Iof.',
    example: 100,
  })
  iof: number;

  @ApiProperty({
    description: 'Side.',
    example: 'SELL',
  })
  side: RemittanceSide;

  @ApiProperty({
    description: 'System.',
  })
  system: System;

  @ApiProperty({
    description: 'Bank quote.',
    example: '100',
  })
  bank_quote: number;

  @ApiProperty({
    description: 'Result amount.',
    example: '100',
  })
  result_amount: number;

  @ApiProperty({
    description: 'Exchange contract ID.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfc',
  })
  exchange_contract_id: string;

  @ApiProperty({
    description: 'Send date.',
    example: new Date(),
  })
  send_date: Date;

  @ApiProperty({
    description: 'Receive date.',
    example: new Date(),
  })
  receive_date: Date;

  @ApiProperty({
    description: 'Is Concomitant.',
    example: true,
  })
  is_concomitant: boolean;

  @ApiProperty({
    description: 'Created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Updated at.',
    example: new Date(),
  })
  updated_at: Date;

  constructor(props: GetAllRemittanceResponseItem) {
    this.id = props.id;
    this.provider = props.provider;
    this.status = props.status;
    this.amount = props.amount;
    this.iof = props.iof;
    this.side = props.side;
    this.system = props.system;
    this.bank_quote = props.bankQuote;
    this.result_amount = props.resultAmount;
    this.exchange_contract_id = props.exchangeContractId || null;
    this.send_date = props.sendDate;
    this.receive_date = props.receiveDate;
    this.is_concomitant = props.isConcomitant;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

class GetAllRemittanceRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Remittance data.',
    type: [GetAllRemittanceRestResponseItem],
  })
  data!: GetAllRemittanceRestResponseItem[];

  constructor(props: GetAllRemittanceResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllRemittanceRestResponseItem(item),
    );
  }
}

/**
 * Get all remittance controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Remittance')
@ApiBearerAuth()
@Controller('otc/remittances')
export class GetAllRemittanceRestController {
  /**
   * Get all remittance endpoint.
   */
  @ApiOperation({
    summary: 'List remittances.',
    description:
      'Gets a list of remittances. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'Remittances have been successfully returned.',
    type: GetAllRemittanceRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
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
    @AuthAdminParam() admin: AuthAdmin,
    @Query() params: GetAllRemittanceParams,
    @KafkaServiceParam(GetAllRemittanceServiceKafka)
    service: GetAllRemittanceServiceKafka,
    @LoggerParam(GetAllRemittanceRestController)
    logger: Logger,
  ): Promise<GetAllRemittanceRestResponse> {
    // Create a payload.
    const payload: GetAllRemittanceRequest = {
      providerId: params.provider_id,
      orderId: params.order_id,
      contractId: params.contract_id,
      resultAmountStart: params.result_amount_start,
      resultAmountEnd: params.result_amount_end,
      bankQuoteStart: params.bank_quote_start,
      bankQuoteEnd: params.bank_quote_end,
      isConcomitant: params.is_concomitant,
      status: params.status,
      amountStart: params.amount_start,
      amountEnd: params.amount_end,
      side: params.side,
      systemId: params.system_id,
      createdAtStart: params.created_at_start,
      createdAtEnd: params.created_at_end,
      updatedAtStart: params.updated_at_start,
      updatedAtEnd: params.updated_at_end,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Get all remittances.', { admin, payload });

    // Call get all remittances service.
    const result = await service.execute(payload);

    logger.debug('Remittances found.', { result });

    const response = new GetAllRemittanceRestResponse(result);

    return response;
  }
}
