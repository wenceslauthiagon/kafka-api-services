import { Logger } from 'winston';
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
import { UpdateCryptoRemittanceUseCase } from '@zro/otc/application';

type TUpdateCryptoRemittanceRequest = Pick<Required<CryptoRemittance>, 'id'> &
  Partial<
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
    }
  >;

export class UpdateCryptoRemittanceRequest
  extends AutoValidator
  implements TUpdateCryptoRemittanceRequest
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsPositive()
  baseCurrencyId?: Currency['id'];

  @IsOptional()
  @IsInt()
  @Min(0)
  baseCurrencyDecimal?: Currency['decimal'];

  @IsOptional()
  @IsString()
  baseCurrencySymbol?: Currency['symbol'];

  @IsOptional()
  @IsEnum(CurrencyType)
  baseCurrencyType?: Currency['type'];

  @IsOptional()
  @IsPositive()
  quoteCurrencyId?: Currency['id'];

  @IsOptional()
  @IsInt()
  @Min(0)
  quoteCurrencyDecimal?: Currency['decimal'];

  @IsOptional()
  @IsString()
  quoteCurrencySymbol?: Currency['symbol'];

  @IsOptional()
  @IsEnum(CurrencyType)
  quoteCurrencyType?: Currency['type'];

  @IsOptional()
  market?: CryptoMarket;

  @IsOptional()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsEnum(OrderSide)
  side?: OrderSide;

  @IsOptional()
  @IsEnum(CryptoRemittanceStatus)
  status?: CryptoRemittanceStatus;

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

  constructor(props: TUpdateCryptoRemittanceRequest) {
    super(props);
  }
}

type TUpdateCryptoRemittanceResponse = Pick<Required<CryptoRemittance>, 'id'> &
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

export class UpdateCryptoRemittanceResponse
  extends AutoValidator
  implements TUpdateCryptoRemittanceResponse
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

  constructor(props: TUpdateCryptoRemittanceResponse) {
    super(props);
  }
}

export class UpdateCryptoRemittanceController {
  private usecase: UpdateCryptoRemittanceUseCase;

  constructor(
    private logger: Logger,
    private cryptoRemittanceRepository: CryptoRemittanceRepository,
  ) {
    this.logger = logger.child({
      context: UpdateCryptoRemittanceController.name,
    });

    this.usecase = new UpdateCryptoRemittanceUseCase(
      this.logger,
      this.cryptoRemittanceRepository,
    );
  }

  async execute(
    request: UpdateCryptoRemittanceRequest,
  ): Promise<UpdateCryptoRemittanceResponse> {
    this.logger.debug('Updating crypto remittance', { request });

    const baseCurrency =
      request.baseCurrencyId &&
      request.baseCurrencySymbol &&
      request.baseCurrencyDecimal &&
      request.baseCurrencyType &&
      new CurrencyEntity({
        id: request.baseCurrencyId,
        symbol: request.baseCurrencySymbol,
        decimal: request.baseCurrencyDecimal,
        type: request.baseCurrencyType,
      });

    const quoteCurrency =
      request.quoteCurrencyId &&
      request.quoteCurrencySymbol &&
      request.quoteCurrencyDecimal &&
      request.quoteCurrencyType &&
      new CurrencyEntity({
        id: request.quoteCurrencyId,
        symbol: request.quoteCurrencySymbol,
        decimal: request.quoteCurrencyDecimal,
        type: request.quoteCurrencyType,
      });

    const provider =
      request.providerId &&
      request.providerName &&
      new ProviderEntity({
        id: request.providerId,
        name: request.providerName,
      });

    const cryptoRemittance = new CryptoRemittanceEntity({
      id: request.id,
      baseCurrency,
      quoteCurrency,
      market: request.market,
      amount: request.amount,
      type: request.type,
      side: request.side,
      price: request.price,
      stopPrice: request.stopPrice,
      validUntil: request.validUntil,
      provider,
      providerOrderId: request.providerOrderId,
      providerName: request.providerName,
      status: request.status,
      executedPrice: request.executedPrice,
      executedAmount: request.executedAmount,
      fee: request.fee,
    });

    const result = await this.usecase.execute(cryptoRemittance);

    return new UpdateCryptoRemittanceResponse({
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
      providerId: result.provider.id,
      providerOrderId: result.providerOrderId,
      providerName: result.providerName,
      status: result.status,
      executedPrice: result.executedPrice,
      executedAmount: result.executedAmount,
      fee: result.fee,
    });
  }
}
