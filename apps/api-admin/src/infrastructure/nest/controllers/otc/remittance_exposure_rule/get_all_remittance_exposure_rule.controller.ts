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
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  AuthAdminParam,
  SettlementDateRuleRestResponseItem,
} from '@zro/api-admin/infrastructure';
import {
  GetAllRemittanceExposureRuleRequest,
  GetAllRemittanceExposureRuleRequestSort,
  GetAllRemittanceExposureRuleResponse,
  GetAllRemittanceExposureRuleResponseItem,
} from '@zro/otc/interface';
import { GetAllRemittanceExposureRuleServiceKafka } from '@zro/otc/infrastructure';

export class GetAllRemittanceExposureRuleParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Currency symbol.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllRemittanceExposureRuleRequestSort,
  })
  @IsOptional()
  @Sort(GetAllRemittanceExposureRuleRequestSort)
  sort?: PaginationSort;
}

export class GetAllRemittanceExposureRuleRestResponseItem {
  @ApiProperty({
    description: 'RemittanceExposureRule ID.',
    example: '295564a9-c5fd-4e73-9abb-72e0383f2dfb',
  })
  id: string;

  @ApiProperty({
    description: 'Currency symbol.',
    example: 'USD',
    examples: ['USD', 'EUR', 'GBP'],
  })
  currency_symbol: string;

  @ApiProperty({
    description: 'Amount.',
    example: '500000',
  })
  amount: number;

  @ApiProperty({
    description: 'Seconds.',
    example: '900',
  })
  seconds: number;

  @ApiPropertyOptional({
    description: 'Settlement date rule items.',
    type: [SettlementDateRuleRestResponseItem],
  })
  settlement_date_rules?: SettlementDateRuleRestResponseItem[];

  @ApiProperty({
    description: 'RemittanceExposureRule created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'RemittanceExposureRule updated at.',
    example: new Date(),
  })
  updated_at: Date;

  constructor(props: GetAllRemittanceExposureRuleResponseItem) {
    this.id = props.id;
    this.currency_symbol = props.currencySymbol;
    this.amount = props.amount;
    this.seconds = props.seconds;
    this.settlement_date_rules =
      props.settlementDateRules &&
      props.settlementDateRules.map(
        (item) => new SettlementDateRuleRestResponseItem(item),
      );
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

export class GetAllRemittanceExposureRuleRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Remittance exposure rule data.',
    type: [GetAllRemittanceExposureRuleRestResponseItem],
  })
  data!: GetAllRemittanceExposureRuleRestResponseItem[];

  constructor(props: GetAllRemittanceExposureRuleResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllRemittanceExposureRuleRestResponseItem(item),
    );
  }
}

/**
 * Get all remittance exposure rule controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Remittance Exposure Rules')
@ApiBearerAuth()
@Controller('otc/remittance-exposure-rules')
export class GetAllRemittanceExposureRuleRestController {
  /**
   * Get all remittance exposure rule endpoint.
   */
  @ApiOperation({
    summary: 'Get all remittance exposure rules.',
    description: 'Lists all existent remittance exposure rules.',
  })
  @ApiOkResponse({
    description: 'Remittance exposure rules have been successfully returned.',
    type: GetAllRemittanceExposureRuleRestResponse,
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
    @Query() params: GetAllRemittanceExposureRuleParams,
    @KafkaServiceParam(GetAllRemittanceExposureRuleServiceKafka)
    service: GetAllRemittanceExposureRuleServiceKafka,
    @LoggerParam(GetAllRemittanceExposureRuleRestController)
    logger: Logger,
  ): Promise<GetAllRemittanceExposureRuleRestResponse> {
    // Create a payload.
    const payload: GetAllRemittanceExposureRuleRequest = {
      currencySymbol: params.currency,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Get all remittance exposure rule.', { admin, payload });

    // Call get all remittance exposure rule service.
    const result = await service.execute(payload);

    logger.debug('Remittance exposure rule found.', { result });

    const response = new GetAllRemittanceExposureRuleRestResponse(result);

    return response;
  }
}
