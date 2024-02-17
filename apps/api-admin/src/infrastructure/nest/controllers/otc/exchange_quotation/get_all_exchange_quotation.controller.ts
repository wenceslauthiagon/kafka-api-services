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
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  Min,
} from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  IsIsoStringDateFormat,
  Sort,
  IsDateBeforeThan,
  IsDateAfterThan,
} from '@zro/common';
import { Controller, Get, Query } from '@nestjs/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { ExchangeQuotationState } from '@zro/otc/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetAllExchangeQuotationServiceKafka } from '@zro/otc/infrastructure';
import {
  GetAllExchangeQuotationRequest,
  GetAllExchangeQuotationRequestSort,
  GetAllExchangeQuotationResponse,
  GetAllExchangeQuotationResponseItem,
} from '@zro/otc/interface';

class GetAllExchangeQuotationParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllExchangeQuotationRequestSort,
  })
  @IsOptional()
  @Sort(GetAllExchangeQuotationRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Quotation Rate.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform((params) => params && parseInt(params.value))
  quotation?: number;

  @ApiPropertyOptional({
    description: 'Exchange quotation state.',
    enum: ExchangeQuotationState,
  })
  @IsOptional()
  @IsEnum(ExchangeQuotationState)
  state?: ExchangeQuotationState;

  @ApiPropertyOptional({
    description: 'Solicitation psp id.',
  })
  @IsOptional()
  @IsUUID(4)
  solicitation_psp_id?: string;

  @ApiPropertyOptional({
    description: 'Gatweay name.',
  })
  @IsString()
  @IsOptional()
  gateway_name?: string;

  @ApiPropertyOptional({
    description: 'Exchange quotation created at start.',
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
    description: 'Exchange quotation created at end.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_end',
  })
  @IsDateAfterThan('created_at_start', false, {
    message: 'created_at_end must be after than created_at_start',
  })
  created_at_end?: Date;
}

class GetAllExchangeQuotationRestResponseItem {
  @ApiProperty({
    description: 'Quotation.',
  })
  quotation: number;

  @ApiProperty({
    description: 'State.',
    enum: ExchangeQuotationState,
    example: ExchangeQuotationState.ACCEPTED,
  })
  state: ExchangeQuotationState;

  @ApiProperty({
    description: 'Amount.',
    example: '5000',
  })
  amount: number;

  @ApiProperty({
    description: 'Amount external currency.',
    example: '5000',
  })
  amount_external_currency: number;

  @ApiProperty({
    description: 'Quotation psp id.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfb',
  })
  quotation_psp_id: string;

  @ApiProperty({
    description: 'Solicitation psp id.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfc',
  })
  solicitation_psp_id: string;

  @ApiProperty({
    description: 'Gateway name.',
  })
  gateway_name: string;

  @ApiProperty({
    description: 'Created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetAllExchangeQuotationResponseItem) {
    this.quotation = props.quotation;
    this.state = props.state;
    this.amount = props.amount;
    this.amount_external_currency = props.amountExternalCurrency;
    this.solicitation_psp_id = props.solicitationPspId;
    this.quotation_psp_id = props.quotationPspId;
    this.gateway_name = props.gatewayName;
    this.created_at = props.createdAt;
  }
}

class GetAllExchangeQuotationRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Exchange Quotations data.',
    type: [GetAllExchangeQuotationRestResponseItem],
  })
  data!: GetAllExchangeQuotationRestResponseItem[];

  constructor(props: GetAllExchangeQuotationResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllExchangeQuotationRestResponseItem(item),
    );
  }
}

/**
 * Get all exchange quotation controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Exchange Quotations')
@ApiBearerAuth()
@Controller('otc/exchange-quotations')
export class GetAllExchangeQuotationRestController {
  /**
   * Get all exchange quotation endpoint.
   */
  @ApiOperation({
    summary: 'List exchange quotations.',
    description:
      'Gets a list of exchange quotations. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'Exchange quotations have been successfully returned.',
    type: GetAllExchangeQuotationRestResponse,
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
    @Query() params: GetAllExchangeQuotationParams,
    @KafkaServiceParam(GetAllExchangeQuotationServiceKafka)
    service: GetAllExchangeQuotationServiceKafka,
    @LoggerParam(GetAllExchangeQuotationRestController)
    logger: Logger,
  ): Promise<GetAllExchangeQuotationRestResponse> {
    // Create a payload.
    const payload: GetAllExchangeQuotationRequest = {
      quotation: params.quotation,
      solicitationPspId: params.solicitation_psp_id,
      gatewayName: params.gateway_name,
      state: params.state,
      createdAtStart: params.created_at_start,
      createdAtEnd: params.created_at_end,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Get all exchange quotations.', { admin, payload });

    // Call get all exchange quotations service.
    const result = await service.execute(payload);

    logger.debug('Exchange quotations found.', { result });

    const response = new GetAllExchangeQuotationRestResponse(result);

    return response;
  }
}
