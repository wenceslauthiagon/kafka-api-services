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
import { Currency, CurrencyType } from '@zro/operations/domain';
import {
  CryptoMarket,
  CryptoRemittance,
  CryptoRemittanceRepository,
  CryptoRemittanceStatus,
  OrderSide,
  OrderType,
  Provider,
} from '@zro/otc/domain';
import { GetCryptoRemittanceByIdUseCase } from '@zro/otc/application';

type TGetCryptoRemittanceByIdRequest = Pick<Required<CryptoRemittance>, 'id'>;

export class GetCryptoRemittanceByIdRequest
  extends AutoValidator
  implements TGetCryptoRemittanceByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetCryptoRemittanceByIdRequest) {
    super(props);
  }
}

type TGetCryptoRemittanceByIdResponse = Pick<Required<CryptoRemittance>, 'id'> &
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

export class GetCryptoRemittanceByIdResponse
  extends AutoValidator
  implements TGetCryptoRemittanceByIdResponse
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

  constructor(props: TGetCryptoRemittanceByIdResponse) {
    super(props);
  }
}

export class GetCryptoRemittanceByIdController {
  private usecase: GetCryptoRemittanceByIdUseCase;

  constructor(
    private logger: Logger,
    private cryptoRemittanceRepository: CryptoRemittanceRepository,
  ) {
    this.logger = logger.child({
      context: GetCryptoRemittanceByIdController.name,
    });

    this.usecase = new GetCryptoRemittanceByIdUseCase(
      this.logger,
      this.cryptoRemittanceRepository,
    );
  }

  async execute(
    request: GetCryptoRemittanceByIdRequest,
  ): Promise<GetCryptoRemittanceByIdResponse> {
    this.logger.debug('Getting crypto remittance', { request });

    const result = await this.usecase.execute(request.id);

    return new GetCryptoRemittanceByIdResponse({
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
