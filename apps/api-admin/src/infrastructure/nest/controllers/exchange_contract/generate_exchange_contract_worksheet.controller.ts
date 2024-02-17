import { Logger } from 'winston';
import { Controller, Body, Post } from '@nestjs/common';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
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
} from '@zro/common';
import {
  GenerateExchangeContractWorksheetResponse,
  GenerateExchangeContractWorksheetRequest,
} from '@zro/otc/interface';
import {
  AuthAdminParam,
  GenerateExchangeContractWorksheetServiceKafka,
} from '@zro/api-admin/infrastructure';
import { AuthAdmin } from '@zro/api-admin/domain';
import { Transform, Type } from 'class-transformer';

export class GenerateExchangeContractWorksheetBody {
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
    description: 'Exchance contract Ids.',
  })
  @IsOptional()
  @IsArray()
  id?: string[];

  @ApiPropertyOptional({
    description: 'VetQuote start range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform((body) => parseFloat(body.value))
  @IsSmallerThan('vet_quote_end', true, {
    message: 'vetQuoteStart must be smaller than vetQuoteEnd',
  })
  vet_quote_start?: number;

  @ApiPropertyOptional({
    description: 'vetQuote end range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform((body) => parseFloat(body.value))
  @IsBiggestThan('vet_quote_start', true, {
    message: 'vetQuoteEnd must be biggest than vetQuoteStart',
  })
  vet_quote_end?: number;

  @ApiPropertyOptional({
    description: 'contractQuote start range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform((body) => parseFloat(body.value))
  @IsSmallerThan('contract_quote_end', true, {
    message: 'ContractQuoteStart must be smaller than ContractQuoteEnd',
  })
  contract_quote_start?: number;

  @ApiPropertyOptional({
    description: 'ContractQuote end range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform((body) => parseFloat(body.value))
  @IsBiggestThan('contract_quote_start', true, {
    message: 'ContractQuoteEnd must be biggest than ContractQuoteStart',
  })
  contract_quote_end?: number;

  @ApiPropertyOptional({
    description: 'TotalAmount start range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform((body) => parseFloat(body.value))
  @IsSmallerThan('total_amount_end', true, {
    message: 'TotalAmountStart must be smaller than TotalAmountEnd',
  })
  total_amount_start?: number;

  @ApiPropertyOptional({
    description: 'totalAmount end range exchange contract.',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform((body) => parseFloat(body.value))
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

export class GenerateExchangeContractWorksheetRestResponse extends GenerateExchangeContractWorksheetResponse {}

/**
 * ExchangeContracts controller. Controller is protected by JWT access token.
 */
@ApiTags('Exchange Contract')
@ApiBearerAuth()
@Controller('otc/exchange-contracts/files/generate')
export class GenerateExchangeContractWorksheetRestController {
  /**
   * Generate ExchangeContract endpoint.
   */
  @ApiOperation({
    summary: 'Generate Exchange Contracts worksheet.',
    description: 'Generate Exchange Contracts worksheet.',
  })
  @ApiOkResponse({
    description: 'The Exchange Contracts worksheet was created successfully.',
    type: null,
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
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(GenerateExchangeContractWorksheetServiceKafka)
    generateWorksheetService: GenerateExchangeContractWorksheetServiceKafka,
    @LoggerParam(GenerateExchangeContractWorksheetRestController)
    logger: Logger,
    @Body() body: GenerateExchangeContractWorksheetBody,
  ): Promise<GenerateExchangeContractWorksheetRestResponse> {
    // Geretare worksheet payload request.
    const payload: GenerateExchangeContractWorksheetRequest = {
      search: body.search,
      exchangeContractIds: body.id,
      vetQuote: {
        start: body.vet_quote_start,
        end: body.vet_quote_end,
      },
      contractQuote: {
        start: body.contract_quote_start,
        end: body.contract_quote_end,
      },
      totalAmount: {
        start: body.total_amount_start,
        end: body.total_amount_end,
      },
      createdAt: {
        start: body.created_at_start,
        end: body.created_at_end,
      },
    };

    logger.debug('Generate Exchange Contracts worksheet.', { admin });

    // Call generate exchange contracts worksheet service.
    const result = await generateWorksheetService.execute(payload);

    logger.debug('Exchange contracts worksheet created.', { result });

    const response = new GenerateExchangeContractWorksheetRestResponse(result);

    return response;
  }
}
