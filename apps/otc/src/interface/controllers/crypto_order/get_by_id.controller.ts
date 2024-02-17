import {
  IsEnum,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Logger } from 'winston';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  Conversion,
  CryptoOrder,
  CryptoOrderRepository,
  CryptoOrderState,
  CryptoRemittance,
  OrderSide,
  OrderType,
  Provider,
  System,
} from '@zro/otc/domain';
import { User } from '@zro/users/domain';
import { GetCryptoOrderByIdUseCase } from '@zro/otc/application';

type TGetCryptoOrderByIdRequest = Pick<Required<CryptoOrder>, 'id'>;

export class GetCryptoOrderByIdRequest
  extends AutoValidator
  implements TGetCryptoOrderByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetCryptoOrderByIdRequest) {
    super(props);
  }
}

type TGetCryptoOrderByIdResponse = Pick<Required<CryptoOrder>, 'id'> &
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

export class GetCryptoOrderByIdResponse
  extends AutoValidator
  implements TGetCryptoOrderByIdResponse
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

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;

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

  constructor(props: TGetCryptoOrderByIdResponse) {
    super(props);
  }
}

export class GetCryptoOrderByIdController {
  private usecase: GetCryptoOrderByIdUseCase;

  constructor(
    private logger: Logger,
    private cryptoOrderRepository: CryptoOrderRepository,
  ) {
    this.logger = logger.child({
      context: GetCryptoOrderByIdController.name,
    });

    this.usecase = new GetCryptoOrderByIdUseCase(
      this.logger,
      this.cryptoOrderRepository,
    );
  }

  async execute(
    request: GetCryptoOrderByIdRequest,
  ): Promise<GetCryptoOrderByIdResponse> {
    this.logger.debug('Creating crypto remittance', { request });

    const result = await this.usecase.execute(request.id);

    return new GetCryptoOrderByIdResponse({
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
