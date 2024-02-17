import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
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
import {
  GetCryptoReportByCurrencyAndFormatResponse,
  GetCryptoReportByCurrencyAndFormatRequest,
} from '@zro/otc/interface';
import { GetCryptoReportByCurrencyAndFormatServiceKafka } from '@zro/otc/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';
import { CryptoReportFormatType } from '@zro/otc/domain';

export class GetCryptoReportByCurrencyAndFormatParams {
  @ApiProperty({
    description: 'Portfolio statement format.',
    enum: CryptoReportFormatType,
  })
  @IsEnum(CryptoReportFormatType)
  format: CryptoReportFormatType;

  @ApiProperty({
    description: 'Portfolio statement currency symbol',
    example: 'BTC',
  })
  @IsString()
  @Length(1, 255)
  currency_symbol: string;

  @ApiPropertyOptional({
    description: 'Portfolio statement created at start.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('created_at_end', false, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Portfolio statement created at end.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('created_at_start', false, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  created_at_end?: Date;
}

export class GetCryptoReportByCurrencyAndFormatRestResponse {
  @ApiProperty({
    description: 'File ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'File name.',
    example:
      'f6e2e084-29b9-4935-a059-5473b13033aa-1234_detalhamento-zrobank.xlsx',
  })
  file_name: string;

  @ApiProperty({
    description: 'File created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetCryptoReportByCurrencyAndFormatResponse) {
    this.id = props.id;
    this.file_name = props.fileName;
    this.created_at = props.createdAt;
  }
}

/**
 * Get crypto report by currency symbol and format controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Portfolio Statements')
@Controller('otc/portfolio-statements')
@DefaultApiHeaders()
@ApiBearerAuth()
@HasPermission('api-users-get-otc-portfolio-statements')
export class GetCryptoReportByCurrencyAndFormatRestController {
  /**
   * Get crypto report by currency symbol and format endpoint.
   */
  @ApiOperation({
    summary: "Get user's portfolio statement.",
    description:
      "Get the user's portfolio statement by currency symbol, format (PDF or XLSX), and date range. If no date range is provided, the default 1-year range will be considered. Insert the statement details in the parameters below and execute the request to obtain the file's ID. Enter the generated file ID in the 'storage/:id/download' endpoint to download the statement. The portfolio statement allows users to view and download a historical record of their wallet activity. It can also serve as a helpful tool to evaluate their trading performance.",
  })
  @ApiOkResponse({
    description: 'Portfolio statement generated successfully.',
    type: GetCryptoReportByCurrencyAndFormatRestResponse,
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
    @Query() query: GetCryptoReportByCurrencyAndFormatParams,
    @KafkaServiceParam(GetCryptoReportByCurrencyAndFormatServiceKafka)
    GetCryptoReportByCurrencyAndFormatService: GetCryptoReportByCurrencyAndFormatServiceKafka,
    @LoggerParam(GetCryptoReportByCurrencyAndFormatRestController)
    logger: Logger,
  ): Promise<GetCryptoReportByCurrencyAndFormatRestResponse> {
    // GetAll payload.
    const payload: GetCryptoReportByCurrencyAndFormatRequest = {
      userId: user.uuid,
      format: query.format,
      currencySymbol: query.currency_symbol.toUpperCase(),
      createdAtStart: query.created_at_start,
      createdAtEnd: query.created_at_end,
    };

    logger.debug('Get crypto report by currency symbol and format.', {
      user,
      payload,
    });

    // Call get crypto report by currency symbol and format service.
    const result =
      await GetCryptoReportByCurrencyAndFormatService.execute(payload);

    logger.debug('Crypto report found.', { result });

    const response =
      result && new GetCryptoReportByCurrencyAndFormatRestResponse(result);

    return response;
  }
}
