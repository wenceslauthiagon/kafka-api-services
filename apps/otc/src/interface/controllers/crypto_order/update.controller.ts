import {
  IsEnum,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  Conversion,
  ConversionEntity,
  CryptoOrder,
  CryptoOrderEntity,
  CryptoOrderRepository,
  CryptoOrderState,
  CryptoRemittance,
  CryptoRemittanceEntity,
  OrderSide,
  OrderType,
  Provider,
  ProviderEntity,
  System,
  SystemEntity,
} from '@zro/otc/domain';
import { User, UserEntity } from '@zro/users/domain';
import { UpdateCryptoOrderUseCase } from '@zro/otc/application';

type TUpdateCryptoOrderRequest = Pick<Required<CryptoOrder>, 'id'> &
  Partial<
    Pick<
      CryptoOrder,
      | 'amount'
      | 'type'
      | 'side'
      | 'state'
      | 'createdAt'
      | 'clientName'
      | 'clientDocument'
      | 'clientDocumentType'
      | 'reconciledId'
    > & {
      baseCurrencyId: Currency['id'];
      systemId: System['id'];
      userId?: User['uuid'];
      providerId?: Provider['id'];
      conversionId?: Conversion['id'];
      cryptoRemittanceId?: CryptoRemittance['id'];
      remainingCryptoRemittanceId?: CryptoRemittance['id'];
      previousCryptoRemittanceId?: CryptoRemittance['id'];
    }
  >;

export class UpdateCryptoOrderRequest
  extends AutoValidator
  implements TUpdateCryptoOrderRequest
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsPositive()
  baseCurrencyId?: Currency['id'];

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
  @IsEnum(CryptoOrderState)
  state?: CryptoOrderState;

  @IsOptional()
  @IsUUID(4)
  providerId?: Provider['id'];

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientDocument?: string;

  @IsOptional()
  @IsString()
  clientDocumentType?: string;

  @IsOptional()
  @IsUUID(4)
  cryptoRemittanceId?: CryptoRemittance['id'];

  @IsOptional()
  @IsUUID(4)
  remainingCryptoRemittanceId?: CryptoRemittance['id'];

  @IsOptional()
  @IsUUID(4)
  previousCryptoRemittanceId?: CryptoRemittance['id'];

  @IsOptional()
  @IsUUID(4)
  reconciledId?: string;

  @IsOptional()
  @IsUUID(4)
  systemId?: string;

  @IsOptional()
  @IsUUID(4)
  userId?: string;

  @IsOptional()
  @IsUUID(4)
  conversionId?: string;

  // @IsOptional()
  // @IsPositive()
  // price?: number;

  // @IsOptional()
  // @IsPositive()
  // stopPrice?: number;

  // @IsOptional()
  // @IsDate()
  // validUntil?: Date;

  // @IsOptional()
  // @IsInt()
  // executedPrice?: number;

  // @IsOptional()
  // @IsInt()
  // executedAmount?: number;

  // @IsOptional()
  // @IsInt()
  // fee?: number;

  constructor(props: TUpdateCryptoOrderRequest) {
    super(props);
  }
}

type TUpdateCryptoOrderResponse = Pick<Required<CryptoOrder>, 'id'> &
  Pick<
    CryptoOrder,
    | 'amount'
    | 'type'
    | 'side'
    | 'state'
    | 'createdAt'
    | 'clientName'
    | 'clientDocument'
    | 'clientDocumentType'
    | 'reconciledId'
  > & {
    baseCurrencyId: Currency['id'];
    systemId: System['id'];
    userId?: User['uuid'];
    providerId?: Provider['id'];
    conversionId?: Conversion['id'];
    cryptoRemittanceId?: CryptoRemittance['id'];
    remainingCryptoRemittanceId?: CryptoRemittance['id'];
    previousCryptoRemittanceId?: CryptoRemittance['id'];
  };

export class UpdateCryptoOrderResponse
  extends AutoValidator
  implements TUpdateCryptoOrderResponse
{
  @IsUUID(4)
  id: string;

  @IsPositive()
  baseCurrencyId: Currency['id'];

  @IsPositive()
  amount: number;

  @IsEnum(OrderType)
  type: OrderType;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsEnum(CryptoOrderState)
  state: CryptoOrderState;

  @IsOptional()
  @IsUUID(4)
  providerId?: Provider['id'];

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientDocument?: string;

  @IsOptional()
  @IsString()
  clientDocumentType?: string;

  @IsOptional()
  @IsUUID(4)
  cryptoRemittanceId?: CryptoRemittance['id'];

  @IsOptional()
  @IsUUID(4)
  remainingCryptoRemittanceId?: CryptoRemittance['id'];

  @IsOptional()
  @IsUUID(4)
  previousCryptoRemittanceId?: CryptoRemittance['id'];

  @IsOptional()
  @IsUUID(4)
  reconciledId?: string;

  @IsUUID(4)
  systemId: string;

  @IsOptional()
  @IsUUID(4)
  userId?: string;

  @IsOptional()
  @IsUUID(4)
  conversionId?: string;

  // @IsOptional()
  // @IsPositive()
  // price?: number;

  // @IsOptional()
  // @IsPositive()
  // stopPrice?: number;

  // @IsOptional()
  // @IsDate()
  // validUntil?: Date;

  // @IsOptional()
  // @IsInt()
  // executedPrice?: number;

  // @IsOptional()
  // @IsInt()
  // executedAmount?: number;

  // @IsOptional()
  // @IsInt()
  // fee?: number;

  constructor(props: TUpdateCryptoOrderResponse) {
    super(props);
  }
}

export class UpdateCryptoOrderController {
  private usecase: UpdateCryptoOrderUseCase;

  constructor(
    private logger: Logger,
    private cryptoOrderRepository: CryptoOrderRepository,
  ) {
    this.logger = logger.child({
      context: UpdateCryptoOrderController.name,
    });

    this.usecase = new UpdateCryptoOrderUseCase(
      this.logger,
      this.cryptoOrderRepository,
    );
  }

  async execute(
    request: UpdateCryptoOrderRequest,
  ): Promise<UpdateCryptoOrderResponse> {
    this.logger.debug('Creating crypto remittance', { request });

    const cryptoOrder = new CryptoOrderEntity({
      id: request.id,
      baseCurrency:
        request.baseCurrencyId &&
        new CurrencyEntity({
          id: request.baseCurrencyId,
        }),
      amount: request.amount,
      type: request.type,
      side: request.side,
      system: request.systemId && new SystemEntity({ id: request.systemId }),
      conversion:
        request.conversionId &&
        new ConversionEntity({ id: request.conversionId }),
      user: request.userId && new UserEntity({ uuid: request.userId }),
      provider:
        request.providerId &&
        new ProviderEntity({
          id: request.providerId,
        }),
      state: request.state,
      clientName: request.clientName,
      clientDocument: request.clientDocument,
      clientDocumentType: request.clientDocument,
      cryptoRemittance:
        request.cryptoRemittanceId &&
        new CryptoRemittanceEntity({ id: request.cryptoRemittanceId }),
      remainingCryptoRemittance:
        request.remainingCryptoRemittanceId &&
        new CryptoRemittanceEntity({ id: request.remainingCryptoRemittanceId }),
      previousCryptoRemittance:
        request.previousCryptoRemittanceId &&
        new CryptoRemittanceEntity({ id: request.previousCryptoRemittanceId }),
      reconciledId: request.reconciledId,
      // price: request.price,
      // stopPrice: request.stopPrice,
      // validUntil: request.validUntil,
      // executedPrice: request.executedPrice,
      // executedAmount: request.executedAmount,
      // fee: request.fee,
    });

    const result = await this.usecase.execute(cryptoOrder);

    return new UpdateCryptoOrderResponse({
      id: result.id,
      baseCurrencyId: result.baseCurrency.id,
      amount: result.amount,
      type: result.type,
      side: result.side,
      state: result.state,
      createdAt: result.createdAt,
      clientName: result.clientName,
      clientDocument: result.clientDocument,
      clientDocumentType: result.clientDocumentType,
      reconciledId: result.reconciledId,
      systemId: result.system.id,
      userId: result.user?.uuid,
      providerId: result.provider?.id,
      conversionId: result.conversion?.id,
      cryptoRemittanceId: result.cryptoRemittance?.id,
      remainingCryptoRemittanceId: result.remainingCryptoRemittance?.id,
      previousCryptoRemittanceId: result.previousCryptoRemittance?.id,
      // price: result.price,
      // stopPrice: result.stopPrice,
      // validUntil: result.validUntil,
      // executedPrice: result.executedPrice,
      // executedAmount: result.executedAmount,
      // fee: result.fee,
    });
  }
}
