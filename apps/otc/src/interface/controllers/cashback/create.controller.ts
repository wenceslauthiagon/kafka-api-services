import { Logger } from 'winston';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { IsIsoStringDateFormat, AutoValidator } from '@zro/common';
import {
  ConversionRepository,
  CryptoOrderRepository,
  SystemRepository,
  CashbackRepository,
  Cashback,
  Conversion,
} from '@zro/otc/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  Currency,
  CurrencyEntity,
  Operation,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  CreateCashbackUseCase as UseCase,
  OperationService,
  QuotationService,
  UserService,
} from '@zro/otc/application';
import {
  CryptoOrderEventEmitterController,
  CryptoOrderEventEmitterControllerInterface,
  ConversionEventEmitterController,
  ConversionEventEmitterControllerInterface,
  CashbackEventEmitterController,
  CashbackEventEmitterControllerInterface,
} from '@zro/otc/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type CurrencySymbol = Currency['symbol'];
type ConversionId = Conversion['id'];
type OperationId = Operation['id'];

export type TCreateCashbackRequest = Pick<
  Cashback,
  'id' | 'amount' | 'description' | 'issuedBy'
> & {
  userId: UserId;
  walletId: WalletId;
  baseCurrencySymbol: CurrencySymbol;
  amountCurrencySymbol: CurrencySymbol;
};

export class CreateCashbackRequest
  extends AutoValidator
  implements TCreateCashbackRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  walletId: WalletId;

  @IsString()
  baseCurrencySymbol: CurrencySymbol;

  @IsString()
  amountCurrencySymbol: CurrencySymbol;

  @IsInt()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  issuedBy?: string;

  @IsUUID(4)
  userId: UserId;

  constructor(props: TCreateCashbackRequest) {
    super(props);
  }
}

type TCreateCashbackResponse = Pick<Cashback, 'id' | 'createdAt'> & {
  conversionId: ConversionId;
  conversionOperationId: OperationId;
};

export class CreateCashbackResponse
  extends AutoValidator
  implements TCreateCashbackResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  conversionId: ConversionId;

  @IsUUID(4)
  conversionOperationId: OperationId;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;

  constructor(props: TCreateCashbackResponse) {
    super(props);
  }
}

export class CreateCashbackController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    conversionRepository: ConversionRepository,
    cryptoOrderRepository: CryptoOrderRepository,
    systemRepository: SystemRepository,
    cashbackRepository: CashbackRepository,
    serviceCryptoOrderEmitter: CryptoOrderEventEmitterControllerInterface,
    serviceConversionEmitter: ConversionEventEmitterControllerInterface,
    serviceCashbackEmitter: CashbackEventEmitterControllerInterface,
    operationService: OperationService,
    quotationService: QuotationService,
    userService: UserService,
    cashbackOperationTransactionTag: string,
    conversionSystemName: string,
    symbolCurrencyMidQuote: string,
  ) {
    this.logger = logger.child({
      context: CreateCashbackController.name,
    });

    const cryptoOrderEventEmitter = new CryptoOrderEventEmitterController(
      serviceCryptoOrderEmitter,
    );

    const conversionEventEmitter = new ConversionEventEmitterController(
      serviceConversionEmitter,
    );

    const cashbackEventEmitter = new CashbackEventEmitterController(
      serviceCashbackEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      conversionRepository,
      cryptoOrderRepository,
      systemRepository,
      cashbackRepository,
      cryptoOrderEventEmitter,
      conversionEventEmitter,
      cashbackEventEmitter,
      operationService,
      quotationService,
      userService,
      cashbackOperationTransactionTag,
      conversionSystemName,
      symbolCurrencyMidQuote,
    );
  }

  async execute(
    request: CreateCashbackRequest,
  ): Promise<CreateCashbackResponse> {
    this.logger.debug('Create cashback request.', { request });

    const {
      id,
      userId,
      walletId,
      baseCurrencySymbol,
      amountCurrencySymbol,
      amount,
      description,
      issuedBy,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });
    const baseCurrency = new CurrencyEntity({ symbol: baseCurrencySymbol });
    const amountCurrency = new CurrencyEntity({ symbol: amountCurrencySymbol });

    const cashback = await this.usecase.execute(
      id,
      user,
      wallet,
      baseCurrency,
      amountCurrency,
      amount,
      description,
      issuedBy,
    );

    const response = new CreateCashbackResponse({
      id: cashback.id,
      conversionId: cashback.conversion.id,
      conversionOperationId: cashback.conversion.operation.id,
      createdAt: cashback.createdAt,
    });

    this.logger.info('Created cashback response.', { cashback: response });

    return response;
  }
}
