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
import {
  IsIsoStringDateFormat,
  AutoValidator,
  Pagination,
  Sort,
  PaginationSort,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
} from '@zro/common';
import {
  RemittanceExposureRuleRepository,
  RemittanceExposureRule,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  GetAllRemittanceExposureRuleUseCase as UseCase,
  OperationService,
} from '@zro/otc/application';
import { Type } from 'class-transformer';
import { SettlementDateRuleItem } from '@zro/otc/interface';

export enum GetAllRemittanceExposureRuleRequestSort {
  CURRENCY_SYMBOL = 'currency_symbol',
}

type CurrencySymbol = Currency['symbol'];

export type TGetAllRemittanceExposureRuleRequest = Pagination & {
  currencySymbol?: CurrencySymbol;
};

export class GetAllRemittanceExposureRuleRequest
  extends PaginationRequest
  implements TGetAllRemittanceExposureRuleRequest
{
  @IsOptional()
  @IsString()
  @MaxLength(255)
  currencySymbol?: CurrencySymbol;

  @IsOptional()
  @Sort(GetAllRemittanceExposureRuleRequestSort)
  sort?: PaginationSort;

  constructor(props: TGetAllRemittanceExposureRuleRequest) {
    super(props);
  }
}

type TGetAllRemittanceExposureRuleResponseItem = Pick<
  RemittanceExposureRule,
  | 'id'
  | 'amount'
  | 'seconds'
  | 'settlementDateRules'
  | 'createdAt'
  | 'updatedAt'
> & {
  currencySymbol: CurrencySymbol;
};

export class GetAllRemittanceExposureRuleResponseItem
  extends AutoValidator
  implements TGetAllRemittanceExposureRuleResponseItem
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

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TGetAllRemittanceExposureRuleResponseItem) {
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

export class GetAllRemittanceExposureRuleResponse extends PaginationResponse<GetAllRemittanceExposureRuleResponseItem> {}

export class GetAllRemittanceExposureRuleController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    remittanceExposureRuleRepository: RemittanceExposureRuleRepository,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: GetAllRemittanceExposureRuleController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      remittanceExposureRuleRepository,
      operationService,
    );
  }

  async execute(
    request: GetAllRemittanceExposureRuleRequest,
  ): Promise<GetAllRemittanceExposureRuleResponse> {
    this.logger.debug('Get all remittance exposure rules request.', {
      request,
    });

    const { currencySymbol, order, page, pageSize, sort } = request;

    const currency =
      currencySymbol && new CurrencyEntity({ symbol: currencySymbol });

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const results = await this.usecase.execute(pagination, currency);

    const data = results.data.map(
      (rule) =>
        new GetAllRemittanceExposureRuleResponseItem({
          id: rule.id,
          currencySymbol: rule.currency.symbol,
          amount: rule.amount,
          seconds: rule.seconds,
          settlementDateRules: rule.settlementDateRules,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt,
        }),
    );

    const response = new GetAllRemittanceExposureRuleResponse({
      ...results,
      data,
    });

    this.logger.debug('Get all remittance exposure rule response.', {
      remittanceExposureRules: response,
    });

    return response;
  }
}
