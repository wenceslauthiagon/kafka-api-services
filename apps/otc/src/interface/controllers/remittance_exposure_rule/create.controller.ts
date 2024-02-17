import { Logger } from 'winston';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsIsoStringDateFormat, AutoValidator } from '@zro/common';
import {
  RemittanceExposureRuleRepository,
  RemittanceExposureRule,
  SettlementDateRule,
  SettlementDateCode,
  RemittanceExposureRuleEntity,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  CreateRemittanceExposureRuleUseCase as UseCase,
  OperationService,
} from '@zro/otc/application';
import { Type } from 'class-transformer';
import {
  RemittanceExposureRuleEventEmitterController,
  RemittanceExposureRuleEventEmitterControllerInterface,
} from '@zro/otc/interface';

export type TSettlementDateRuleItem = SettlementDateRule;

export class SettlementDateRuleItem
  extends AutoValidator
  implements TSettlementDateRuleItem
{
  @IsInt()
  @IsPositive()
  amount!: number;

  @IsEnum(SettlementDateCode)
  sendDate!: SettlementDateCode;

  @IsEnum(SettlementDateCode)
  receiveDate!: SettlementDateCode;

  constructor(props: TSettlementDateRuleItem) {
    super(props);
  }
}

type CurrencySymbol = Currency['symbol'];

export type TCreateRemittanceExposureRuleRequest = Pick<
  RemittanceExposureRule,
  'id' | 'amount' | 'seconds' | 'settlementDateRules'
> & {
  currencySymbol: CurrencySymbol;
};

export class CreateRemittanceExposureRuleRequest
  extends AutoValidator
  implements TCreateRemittanceExposureRuleRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  currencySymbol: CurrencySymbol;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  @IsPositive()
  seconds: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SettlementDateRuleItem)
  settlementDateRules?: SettlementDateRuleItem[];

  constructor(props: TCreateRemittanceExposureRuleRequest) {
    super(
      Object.assign({}, props, {
        settlementDateRules:
          props.settlementDateRules &&
          props.settlementDateRules.map(
            (settlementDateRule) =>
              new SettlementDateRuleItem(settlementDateRule),
          ),
      }),
    );
  }
}

type TCreateRemittanceExposureRuleResponse = Pick<
  RemittanceExposureRule,
  'id' | 'amount' | 'seconds' | 'settlementDateRules' | 'createdAt'
> & {
  currencySymbol: CurrencySymbol;
};

export class CreateRemittanceExposureRuleResponse
  extends AutoValidator
  implements TCreateRemittanceExposureRuleResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  currencySymbol: CurrencySymbol;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  @IsPositive()
  seconds: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SettlementDateRuleItem)
  settlementDateRules?: SettlementDateRuleItem[];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateRemittanceExposureRuleResponse) {
    super(
      Object.assign({}, props, {
        settlementDateRules:
          props.settlementDateRules &&
          props.settlementDateRules.map(
            (settlementDateRule) =>
              new SettlementDateRuleItem(settlementDateRule),
          ),
      }),
    );
  }
}

export class CreateRemittanceExposureRuleController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    operationService: OperationService,
    serviceRemittanceExposureRuleEmitter: RemittanceExposureRuleEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateRemittanceExposureRuleController.name,
    });

    const remittanceExposureRuleEventEmitter =
      new RemittanceExposureRuleEventEmitterController(
        serviceRemittanceExposureRuleEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      remittanceExposureRuleRepository,
      operationService,
      remittanceExposureRuleEventEmitter,
    );
  }

  async execute(
    request: CreateRemittanceExposureRuleRequest,
  ): Promise<CreateRemittanceExposureRuleResponse> {
    this.logger.debug('Create remittance exposure rule request.', { request });

    const { id, currencySymbol, amount, seconds, settlementDateRules } =
      request;

    const currency = new CurrencyEntity({ symbol: currencySymbol });

    const remittanceExposureRule = new RemittanceExposureRuleEntity({
      id,
      currency,
      amount,
      seconds,
      settlementDateRules,
    });

    const rule = await this.usecase.execute(remittanceExposureRule);

    const response = new CreateRemittanceExposureRuleResponse({
      id: rule.id,
      currencySymbol: rule.currency.symbol,
      amount: rule.amount,
      seconds: rule.seconds,
      settlementDateRules: rule.settlementDateRules,
      createdAt: rule.createdAt,
    });

    this.logger.debug('Create remittance exposure rule response.', {
      remittanceExposureRule: response,
    });

    return response;
  }
}
