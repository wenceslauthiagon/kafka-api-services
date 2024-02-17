import {
  IsDate,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import { Currency, CurrencyEntity, CurrencyType } from '@zro/operations/domain';
import {
  CryptoMarket,
  CryptoRemittance,
  CryptoRemittanceEntity,
  CryptoRemittanceRepository,
  CryptoRemittanceStatus,
  OrderSide,
  OrderType,
  Provider,
  ProviderEntity,
} from '@zro/otc/domain';
import { CreateCryptoRemittanceUseCase } from '@zro/otc/application';

type TCreateCryptoRemittanceRequest = Pick<Required<CryptoRemittance>, 'id'> &
  Pick<
    CryptoRemittance,
    | 'market'
    | 'amount'
    | 'type'
    | 'side'
    | 'status'
    | 'price'
    | 'stopPrice'
    | 'validUntil'
    | 'providerOrderId'
    | 'providerName'
    | 'executedPrice'
    | 'executedAmount'
    | 'fee'
  > & {
    baseCurrencyId: Currency['id'];
    baseCurrencyDecimal: Currency['decimal'];
    baseCurrencySymbol: Currency['symbol'];
    baseCurrencyType: Currency['type'];
    quoteCurrencyId: Currency['id'];
    quoteCurrencyDecimal: Currency['decimal'];
    quoteCurrencySymbol: Currency['symbol'];
    quoteCurrencyType: Currency['type'];
    providerId?: Provider['id'];
  };

export class CreateCryptoRemittanceRequest
  extends AutoValidator
  implements TCreateCryptoRemittanceRequest
{
  @IsUUID(4)
  id: string;

  @IsPositive()
  baseCurrencyId: Currency['id'];

  @IsInt()
  @Min(0)
  baseCurrencyDecimal: Currency['decimal'];

  @IsString()
  baseCurrencySymbol: Currency['symbol'];

  @IsEnum(CurrencyType)
  baseCurrencyType: Currency['type'];

  @IsPositive()
  quoteCurrencyId: Currency['id'];

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: Currency['decimal'];

  @IsString()
  quoteCurrencySymbol: Currency['symbol'];

  @IsEnum(CurrencyType)
  quoteCurrencyType: Currency['type'];

  @IsDefined()
  market: CryptoMarket;

  @IsPositive()
  amount: number;

  @IsEnum(OrderType)
  type: OrderType;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsEnum(CryptoRemittanceStatus)
  status: CryptoRemittanceStatus;

  @IsOptional()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsPositive()
  stopPrice?: number;

  @IsOptional()
  @IsDate()
  validUntil?: Date;

  @IsOptional()
  @IsUUID(4)
  providerId?: Provider['id'];

  @IsOptional()
  @IsString()
  providerOrderId?: string;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsInt()
  executedPrice?: number;

  @IsOptional()
  @IsInt()
  executedAmount?: number;

  @IsOptional()
  @IsInt()
  fee?: number;

  constructor(props: TCreateCryptoRemittanceRequest) {
    super(props);
  }
}

type TCreateCryptoRemittanceResponse = Pick<Required<CryptoRemittance>, 'id'> &
  Pick<
    CryptoRemittance,
    | 'market'
    | 'amount'
    | 'type'
    | 'side'
    | 'status'
    | 'price'
    | 'stopPrice'
    | 'validUntil'
    | 'providerOrderId'
    | 'providerName'
    | 'executedPrice'
    | 'executedAmount'
    | 'fee'
  > & {
    baseCurrencyId: Currency['id'];
    baseCurrencyDecimal: Currency['decimal'];
    baseCurrencySymbol: Currency['symbol'];
    baseCurrencyType: Currency['type'];
    quoteCurrencyId: Currency['id'];
    quoteCurrencyDecimal: Currency['decimal'];
    quoteCurrencySymbol: Currency['symbol'];
    quoteCurrencyType: Currency['type'];
    providerId?: Provider['id'];
  };

export class CreateCryptoRemittanceResponse
  extends AutoValidator
  implements TCreateCryptoRemittanceResponse
{
  @IsUUID(4)
  id: string;

  @IsPositive()
  baseCurrencyId: Currency['id'];

  @IsInt()
  @Min(0)
  baseCurrencyDecimal: Currency['decimal'];

  @IsString()
  baseCurrencySymbol: Currency['symbol'];

  @IsEnum(CurrencyType)
  baseCurrencyType: Currency['type'];

  @IsPositive()
  quoteCurrencyId: Currency['id'];

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: Currency['decimal'];

  @IsString()
  quoteCurrencySymbol: Currency['symbol'];

  @IsEnum(CurrencyType)
  quoteCurrencyType: Currency['type'];

  @IsDefined()
  market: CryptoMarket;

  @IsPositive()
  amount: number;

  @IsEnum(OrderType)
  type: OrderType;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsEnum(CryptoRemittanceStatus)
  status: CryptoRemittanceStatus;

  @IsOptional()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsPositive()
  stopPrice?: number;

  @IsOptional()
  @IsDate()
  validUntil?: Date;

  @IsOptional()
  @IsUUID(4)
  providerId?: Provider['id'];

  @IsOptional()
  @IsString()
  providerOrderId?: string;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsInt()
  executedPrice?: number;

  @IsOptional()
  @IsInt()
  executedAmount?: number;

  @IsOptional()
  @IsInt()
  fee?: number;

  constructor(props: TCreateCryptoRemittanceResponse) {
    super(props);
  }
}

export class CreateCryptoRemittanceController {
  private usecase: CreateCryptoRemittanceUseCase;

  constructor(
    private logger: Logger,
    private cryptoRemittanceRepository: CryptoRemittanceRepository,
  ) {
    this.logger = logger.child({
      context: CreateCryptoRemittanceController.name,
    });

    this.usecase = new CreateCryptoRemittanceUseCase(
      this.logger,
      this.cryptoRemittanceRepository,
    );
  }

  async execute(
    request: CreateCryptoRemittanceRequest,
  ): Promise<CreateCryptoRemittanceResponse> {
    this.logger.debug('Creating crypto remittance', { request });

    const cryptoRemittance = new CryptoRemittanceEntity({
      id: request.id,
      baseCurrency: new CurrencyEntity({
        id: request.baseCurrencyId,
        symbol: request.baseCurrencySymbol,
        decimal: request.baseCurrencyDecimal,
        type: request.baseCurrencyType,
      }),
      quoteCurrency: new CurrencyEntity({
        id: request.quoteCurrencyId,
        symbol: request.quoteCurrencySymbol,
        decimal: request.quoteCurrencyDecimal,
        type: request.quoteCurrencyType,
      }),
      market: request.market,
      amount: request.amount,
      type: request.type,
      side: request.side,
      price: request.price,
      stopPrice: request.stopPrice,
      validUntil: request.validUntil,
      provider:
        request.providerId &&
        new ProviderEntity({
          id: request.providerId,
        }),
      providerOrderId: request.providerOrderId,
      providerName: request.providerName,
      status: request.status,
      executedPrice: request.executedPrice,
      executedAmount: request.executedAmount,
      fee: request.fee,
    });

    const result = await this.usecase.execute(cryptoRemittance);

    return new CreateCryptoRemittanceResponse({
      id: result.id,
      baseCurrencyId: result.baseCurrency.id,
      baseCurrencySymbol: result.baseCurrency.symbol,
      baseCurrencyDecimal: result.baseCurrency.decimal,
      baseCurrencyType: result.baseCurrency.type,
      quoteCurrencyId: result.quoteCurrency.id,
      quoteCurrencySymbol: result.quoteCurrency.symbol,
      quoteCurrencyDecimal: result.quoteCurrency.decimal,
      quoteCurrencyType: result.quoteCurrency.type,
      market: result.market,
      amount: result.amount,
      type: result.type,
      side: result.side,
      price: result.price,
      stopPrice: result.stopPrice,
      validUntil: result.validUntil,
      providerId: result.provider?.id,
      providerOrderId: result.providerOrderId,
      providerName: result.providerName,
      status: result.status,
      executedPrice: result.executedPrice,
      executedAmount: result.executedAmount,
      fee: result.fee,
    });
  }
}
