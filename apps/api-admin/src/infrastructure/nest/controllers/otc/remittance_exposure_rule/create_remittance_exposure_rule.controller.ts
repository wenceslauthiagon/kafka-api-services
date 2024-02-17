import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
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
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Body, Controller, Post } from '@nestjs/common';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { SettlementDateCode } from '@zro/otc/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { CreateRemittanceExposureRuleServiceKafka } from '@zro/otc/infrastructure';
import {
  CreateRemittanceExposureRuleRequest,
  CreateRemittanceExposureRuleResponse,
} from '@zro/otc/interface';

export class SettlementDateRuleItem {
  @ApiProperty({
    description: 'Amount',
    example: '100000000',
  })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Send date code.',
    example: 'D2',
    enum: SettlementDateCode,
  })
  @IsEnum(SettlementDateCode)
  sendDate: SettlementDateCode;

  @ApiProperty({
    description: 'Receive date code.',
    example: 'D2',
    enum: SettlementDateCode,
  })
  @IsEnum(SettlementDateCode)
  receiveDate: SettlementDateCode;
}

export class CreateRemittanceExposureRuleBody {
  @ApiProperty({
    description: 'Currency symbol.',
    example: 'USD',
    examples: ['USD', 'EUR', 'GBP'],
  })
  @IsString()
  currency_symbol: string;

  @ApiProperty({
    description: 'Amount.',
    example: '500000',
  })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Seconds.',
    example: '900',
  })
  @IsInt()
  @IsPositive()
  seconds: number;

  @ApiPropertyOptional({
    description: 'Settlement date rule items.',
    type: [SettlementDateRuleItem],
  })
  @IsOptional()
  @IsArray()
  @Type(() => SettlementDateRuleItem)
  @ValidateNested({ each: true })
  settlementDateRules?: SettlementDateRuleItem[];
}

export class SettlementDateRuleRestResponseItem {
  @ApiProperty({
    description: 'Amount',
    example: '100000000',
  })
  amount: number;

  @ApiProperty({
    description: 'Send date code.',
    example: 'D2',
    enum: SettlementDateCode,
  })
  sendDate: SettlementDateCode;

  @ApiProperty({
    description: 'Receive date code.',
    example: 'D2',
    enum: SettlementDateCode,
  })
  receiveDate: SettlementDateCode;

  constructor(props: SettlementDateRuleItem) {
    this.amount = props.amount;
    this.sendDate = props.sendDate;
    this.receiveDate = props.receiveDate;
  }
}

export class CreateRemittanceExposureRuleRestResponse {
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

  constructor(props: CreateRemittanceExposureRuleResponse) {
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
 * Create remittance exposure rule controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc | Remittance Exposure Rules')
@ApiBearerAuth()
@Controller('otc/remittance-exposure-rules')
export class CreateRemittanceExposureRuleRestController {
  /**
   * Create remittance exposure rule endpoint.
   */
  @ApiOperation({
    summary: 'Create new remittance exposure rule.',
    description: `Creates a new remittance exposure rule.<br>
    <br>Remittances are automatically created from Remittance Orders with the status OPEN. The remittance exposure rule defines the criteria for determining whether a remittance should be created or not.<br>
    <ul>
    <li><b>currency_symbol</b>: Defines the currency where this rule is applied.
    <li><b>amount</b>: Defines the minimum amount where the remittance order is in dangerous exposure. For example: if there is OPEN remittance orders valuing over $5000 and the exposure rule amount is $5000, a new remittance should be created immediately.
    <li><b>seconds</b>: Defines the minimum time in seconds where the remittance order is in dangerous exposure. For example: if there is OPEN remittance orders created over 900 seconds ago and the exposure rule seconds is 900 seconds, a new remittance should be created immediately.
    <li><b>settlement_date_rules (OPTIONAL)</b>: Defines the rules for settlement date (when to send/receive the currency). If no settlement date rule id defined, the default settlement date rule will be considered, which is D0D0 for any amount. This optional attribute is an array of objects where each object is composed by amount, send date and receive date. Amount is the minimum daily amount to consider this settlement date rule. Send date is the date code where the remittance should be sent. Receive date is the date code where the remittance should be received.<br> 
      For example:<br>
      {
        "amount": 1000000,
        "sendDate": "D2",
        "receiveDate": "D2"
      }
      <br>This example means that when the total amount of remittances exceeds 1 million on a given day, new remittances will be created with the settlement date code 'D2D2'.
  </ul>`,
  })
  @ApiOkResponse({
    description: 'Remittance exposure rule has been successfully created.',
    type: CreateRemittanceExposureRuleRestResponse,
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
  @Post()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @Body() body: CreateRemittanceExposureRuleBody,
    @KafkaServiceParam(CreateRemittanceExposureRuleServiceKafka)
    service: CreateRemittanceExposureRuleServiceKafka,
    @LoggerParam(CreateRemittanceExposureRuleRestController)
    logger: Logger,
  ): Promise<CreateRemittanceExposureRuleRestResponse> {
    // Create a payload.
    const payload: CreateRemittanceExposureRuleRequest = {
      id: uuidV4(),
      currencySymbol: body.currency_symbol,
      amount: body.amount,
      seconds: body.seconds,
      settlementDateRules: body.settlementDateRules,
    };

    logger.debug('Create remittance exposure rule.', { admin, payload });

    // Call create remittance exposure rule service.
    const result = await service.execute(payload);

    logger.debug('Created remittance exposure rule.', { result });

    const response = new CreateRemittanceExposureRuleRestResponse(result);

    return response;
  }
}
