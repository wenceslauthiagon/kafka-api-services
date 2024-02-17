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
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Body, Controller, Param, Patch } from '@nestjs/common';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  AuthAdminParam,
  SettlementDateRuleRestResponseItem,
  SettlementDateRuleItem,
} from '@zro/api-admin/infrastructure';
import { UpdateRemittanceExposureRuleServiceKafka } from '@zro/otc/infrastructure';
import {
  UpdateRemittanceExposureRuleRequest,
  UpdateRemittanceExposureRuleResponse,
} from '@zro/otc/interface';

export class UpdateRemittanceExposureRuleParams {
  @ApiProperty({
    description: 'Remittance Exposure Rule ID.',
  })
  @IsUUID(4)
  id!: string;
}

export class UpdateRemittanceExposureRuleBody {
  @ApiPropertyOptional({
    description: 'Currency symbol.',
    example: 'USD',
    examples: ['USD', 'EUR', 'GBP'],
  })
  @IsOptional()
  @IsString()
  currency_symbol?: string;

  @ApiPropertyOptional({
    description: 'Amount.',
    example: '500000',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Seconds.',
    example: '900',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  seconds?: number;

  @ApiPropertyOptional({
    description: 'Settlement date rule items.',
    type: [SettlementDateRuleItem],
  })
  @IsOptional()
  @IsArray()
  @Type(() => SettlementDateRuleItem)
  @ValidateNested({ each: true })
  settlement_date_rules?: SettlementDateRuleItem[];
}

export class UpdateRemittanceExposureRuleRestResponse {
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

  constructor(props: UpdateRemittanceExposureRuleResponse) {
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
  }
}

/**
 * Update remittance exposure rule controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Remittance Exposure Rules')
@ApiBearerAuth()
@Controller('otc/remittance-exposure-rules/:id')
export class UpdateRemittanceExposureRuleRestController {
  /**
   * Update remittance exposure rule endpoint.
   */
  @ApiOperation({
    summary: 'Update remittance exposure rule.',
    description: 'Updates an existent currency remittance exposure rule.',
  })
  @ApiOkResponse({
    description: 'Remittance exposure rule has been successfully updated.',
    type: UpdateRemittanceExposureRuleRestResponse,
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
  @Patch()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @Body() body: UpdateRemittanceExposureRuleBody,
    @Param() params: UpdateRemittanceExposureRuleParams,
    @KafkaServiceParam(UpdateRemittanceExposureRuleServiceKafka)
    service: UpdateRemittanceExposureRuleServiceKafka,
    @LoggerParam(UpdateRemittanceExposureRuleRestController)
    logger: Logger,
  ): Promise<UpdateRemittanceExposureRuleRestResponse> {
    // Create a payload.
    const payload: UpdateRemittanceExposureRuleRequest = {
      id: params.id,
      currencySymbol: body.currency_symbol,
      amount: body.amount,
      seconds: body.seconds,
      settlementDateRules: body.settlement_date_rules,
    };

    logger.debug('Update remittance exposure rule.', { admin, payload });

    // Call update remittance exposure rule service.
    const result = await service.execute(payload);

    logger.debug('Updated remittance exposure rule.', { result });

    const response = new UpdateRemittanceExposureRuleRestResponse(result);

    return response;
  }
}
