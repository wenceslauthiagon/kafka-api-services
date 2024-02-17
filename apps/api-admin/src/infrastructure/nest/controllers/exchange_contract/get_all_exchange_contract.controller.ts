import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuthAdmin } from '@zro/api-admin/domain';
import { Transform } from 'class-transformer';
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
  IsBiggestThan,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  IsSmallerThan,
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import {
  GetAllExchangeContractResponseItem,
  GetAllExchangeContractResponse,
  GetAllExchangeContractRequest,
  GetAllExchangeContractRequestSort,
} from '@zro/otc/interface';
import {
  AuthAdminParam,
  GetAllExchangeContractServiceKafka,
} from '@zro/api-admin/infrastructure';

export class GetAllExchangeContractParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllExchangeContractRequestSort,
  })
  @IsOptional()
  @Sort(GetAllExchangeContractRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description:
      'Search filter. This filter is used to search for exchange contract number.',
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  search?: string;

  @ApiPropertyOptional({
    description: 'VetQuote start range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Transform((body) => body.value && parseFloat(body.value))
  @IsSmallerThan('vet_quote_end', true, {
    message: 'vetQuoteStart must be smaller than vetQuoteEnd',
  })
  vet_quote_start?: number;

  @ApiPropertyOptional({
    description: 'vetQuote end range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Transform((body) => body.value && parseFloat(body.value))
  @IsBiggestThan('vet_quote_start', true, {
    message: 'vetQuoteEnd must be biggest than vetQuoteStart',
  })
  vet_quote_end?: number;

  @ApiPropertyOptional({
    description: 'contractQuote start range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Transform((body) => body.value && parseFloat(body.value))
  @IsSmallerThan('contract_quote_end', true, {
    message: 'ContractQuoteStart must be smaller than ContractQuoteEnd',
  })
  contract_quote_start?: number;

  @ApiPropertyOptional({
    description: 'ContractQuote end range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Transform((body) => body.value && parseFloat(body.value))
  @IsBiggestThan('contract_quote_start', true, {
    message: 'ContractQuoteEnd must be biggest than ContractQuoteStart',
  })
  contract_quote_end?: number;

  @ApiPropertyOptional({
    description: 'TotalAmount start range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Transform((body) => body.value && parseFloat(body.value))
  @IsSmallerThan('total_amount_end', true, {
    message: 'TotalAmountStart must be smaller than TotalAmountEnd',
  })
  total_amount_start?: number;

  @ApiPropertyOptional({
    description: 'totalAmount end range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Transform((body) => body.value && parseFloat(body.value))
  @IsBiggestThan('total_amount_start', true, {
    message: 'TotalAmountEnd must be biggest than TotalAmountStart',
  })
  total_amount_end?: number;

  @ApiPropertyOptional({
    description: 'CreatedAt date start range exchange contract.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('created_at_end', true, {
    message: 'CreatedAtStart must be before than CreatedAtEnd',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'CreatedAt date end range exchange contract.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('created_at_start', true, {
    message: 'CreatedAtEnd must be after than CreatedAtStart',
  })
  created_at_end?: Date;
}

class GetAllExchangeContractRestResponseItem {
  @ApiProperty({
    description: 'Exchange Contract ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Exchange Contract number.',
    example: '10922375',
  })
  contract_number!: string;

  @ApiProperty({
    description: 'Exchange Contract Vet Quote.',
    example: 2,
  })
  vet_quote!: number;

  @ApiProperty({
    description: 'Exchange Contract quote.',
    example: 2.557,
  })
  contract_quote!: number;

  @ApiProperty({
    description: 'Exchange Contract total amount.',
    example: 30000.82,
  })
  total_amount!: number;

  @ApiPropertyOptional({
    description: 'File ID associated to Exchange Contract.',
    example: 'f72c7f03-ac35-4a81-a257-add53ce16a9c',
  })
  file_id: string;

  @ApiProperty({
    description: 'ExchangeContract Exchange createdAt.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllExchangeContractResponseItem) {
    this.id = props.id;
    this.contract_number = props.contractNumber;
    this.vet_quote = props.vetQuote;
    this.contract_quote = props.contractQuote;
    this.total_amount = props.totalAmount;
    this.file_id = props.fileId;
    this.created_at = props.createdAt;
  }
}

export class GetAllExchangeContractRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Exchange contracts data.',
    type: [GetAllExchangeContractRestResponseItem],
  })
  data!: GetAllExchangeContractRestResponseItem[];

  constructor(props: GetAllExchangeContractResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllExchangeContractRestResponseItem(item),
    );
  }
}

/**
 * Exchange Contract Controller. It is protected by JWT access token.
 */
@ApiTags('Exchange Contract')
@ApiBearerAuth()
@Controller('otc/exchange-contracts')
export class GetAllExchangeContractRestController {
  /**
   * List exchange contracts endpoint.
   */
  @ApiOperation({
    summary: 'List exchange contracts.',
    description: 'List exchange contracts.',
  })
  @ApiOkResponse({
    description: 'The exchange contracts returned successfully.',
    type: GetAllExchangeContractRestResponse,
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
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(GetAllExchangeContractServiceKafka)
    getAllService: GetAllExchangeContractServiceKafka,
    @LoggerParam(GetAllExchangeContractRestController)
    logger: Logger,
    @Query() params: GetAllExchangeContractParams,
  ): Promise<GetAllExchangeContractRestResponse> {
    // Get all exchange contract request payload.
    const payload: GetAllExchangeContractRequest = {
      vetQuote: {
        start: params.vet_quote_start,
        end: params.vet_quote_end,
      },
      contractQuote: {
        start: params.contract_quote_start,
        end: params.contract_quote_end,
      },
      totalAmount: {
        start: params.total_amount_start,
        end: params.total_amount_end,
      },
      createdAt: {
        start: params.created_at_start,
        end: params.created_at_end,
      },
      page: params.page,
      pageSize: params.size,
      search: params.search,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Get all exchange contracts.', { admin, payload });

    // Call get all exchange contracts service.
    const result = await getAllService.execute(payload);

    logger.debug('Exchange contracts found.', { result });

    const response = new GetAllExchangeContractRestResponse(result);

    return response;
  }
}
