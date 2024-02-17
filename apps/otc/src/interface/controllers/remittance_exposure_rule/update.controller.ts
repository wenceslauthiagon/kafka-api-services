import { Logger } from 'winston';
import {
  IsArray,
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
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  UpdateRemittanceExposureRuleUseCase as UseCase,
  OperationService,
} from '@zro/otc/application';
import { Type } from 'class-transformer';
import {
  RemittanceExposureRuleEventEmitterController,
  RemittanceExposureRuleEventEmitterControllerInterface,
  SettlementDateRuleItem,
} from '@zro/otc/interface';

type CurrencySymbol = Currency['symbol'];

export type TUpdateRemittanceExposureRuleRequest = Pick<
  RemittanceExposureRule,
  'id'
> &
  Partial<
    Pick<RemittanceExposureRule, 'amount' | 'seconds' | 'settlementDateRules'>
  > & {
    currencySymbol?: CurrencySymbol;
  };

export class UpdateRemittanceExposureRuleRequest
  extends AutoValidator
  implements TUpdateRemittanceExposureRuleRequest
{
  @IsUUID(4)
  id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  currencySymbol?: CurrencySymbol;

  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  seconds?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SettlementDateRuleItem)
  settlementDateRules?: SettlementDateRuleItem[];

  constructor(props: TUpdateRemittanceExposureRuleRequest) {
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

type TUpdateRemittanceExposureRuleResponse = Pick<
  RemittanceExposureRule,
  'id' | 'amount' | 'seconds' | 'settlementDateRules' | 'createdAt'
> & {
  currencySymbol: CurrencySymbol;
};

export class UpdateRemittanceExposureRuleResponse
  extends AutoValidator
  implements TUpdateRemittanceExposureRuleResponse
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

  constructor(props: TUpdateRemittanceExposureRuleResponse) {
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

export class UpdateRemittanceExposureRuleController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    operationService: OperationService,
    serviceRemittanceExposureRuleEmitter: RemittanceExposureRuleEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: UpdateRemittanceExposureRuleController.name,
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
    request: UpdateRemittanceExposureRuleRequest,
  ): Promise<UpdateRemittanceExposureRuleResponse> {
    this.logger.debug('Create remittance exposure rule request.', { request });

    const { id, currencySymbol, amount, seconds, settlementDateRules } =
      request;

    const currency =
      currencySymbol && new CurrencyEntity({ symbol: currencySymbol });

    const rule = await this.usecase.execute(
      id,
      currency,
      amount,
      seconds,
      settlementDateRules,
    );

    const response = new UpdateRemittanceExposureRuleResponse({
      id: rule.id,
      currencySymbol: rule.currency.symbol,
      amount: rule.amount,
      seconds: rule.seconds,
      settlementDateRules: rule.settlementDateRules,
      createdAt: rule.createdAt,
    });

    this.logger.debug('Update remittance exposure rule response.', {
      remittanceExposureRule: response,
    });

    return response;
  }
}
