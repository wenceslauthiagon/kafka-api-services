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
import { IsOptional, IsUUID } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
} from '@zro/common';
import { Controller, Get, Query } from '@nestjs/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetBotOtcAnalysisServiceKafka } from '@zro/otc-bot/infrastructure';
import {
  GetBotOtcAnalysisRequest,
  GetBotOtcAnalysisResponse,
} from '@zro/otc-bot/interface';

class GetBotOtcAnalysisParams {
  @ApiProperty({
    description: 'Bot Otc ID.',
  })
  @IsUUID(4)
  id!: string;

  @ApiPropertyOptional({
    description: 'Bot Otc Order created at start.',
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
    description: 'Bot Otc Order created at end.',
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

class GetBotOtcAnalysisRestResponse {
  @ApiProperty({
    description: 'Bot Otc ID.',
  })
  bot_otc_id: string;

  @ApiProperty({
    description: 'Bot Otc Profit.',
  })
  profit: number;

  @ApiProperty({
    description: 'Bot Otc Profit Margin (profit/volume) in BPS.',
  })
  profit_margin: number;

  @ApiProperty({
    description: 'Bot Otc Volume.',
  })
  volume: number;

  @ApiProperty({
    description: 'Bot Otc Quote Currency Tag.',
  })
  quote_currency_tag: string;

  @ApiProperty({
    description: 'Bot Otc Quote Currency Decimal.',
  })
  quote_currency_decimal: number;

  constructor(props: GetBotOtcAnalysisResponse) {
    this.bot_otc_id = props.botOtcId;
    this.profit = props.profit;
    this.profit_margin = props.profitMargin;
    this.volume = props.volume;
    this.quote_currency_tag = props.quoteCurrencyTag;
    this.quote_currency_decimal = props.quoteCurrencyDecimal;
  }
}

/**
 * Get bot otc analysis controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc Bot')
@ApiBearerAuth()
@Controller('otc-bot/analysis')
export class GetBotOtcAnalysisRestController {
  /**
   * Get bot otc analysis endpoint.
   */
  @ApiOperation({
    summary: 'Get Bot Otc analysis.',
    description:
      'Generates an analysis for the provided Bot Otc based on a date range. If no date range is specified, the analysis will be calculated for the current date.',
  })
  @ApiOkResponse({
    description: 'Bot Otc analysis have been successfully returned.',
    type: GetBotOtcAnalysisRestResponse,
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
    @Query() params: GetBotOtcAnalysisParams,
    @KafkaServiceParam(GetBotOtcAnalysisServiceKafka)
    service: GetBotOtcAnalysisServiceKafka,
    @LoggerParam(GetBotOtcAnalysisRestController)
    logger: Logger,
  ): Promise<GetBotOtcAnalysisRestResponse> {
    // Create a payload.
    const payload: GetBotOtcAnalysisRequest = {
      id: params.id,
      createdAtStart: params.created_at_start,
      createdAtEnd: params.created_at_end,
    };

    logger.debug('Get bot otc analysis.', { admin, payload });

    // Call get bot otc analysis service.
    const result = await service.execute(payload);

    logger.debug('Bot otc analysis found.', { result });

    const response = result && new GetBotOtcAnalysisRestResponse(result);

    return response;
  }
}
