import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Bank, BankEntity } from '@zro/banking/domain';
import {
  AccountType,
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
  WarningPixSkipListRepository,
} from '@zro/pix-payments/domain';
import {
  BankingService,
  OperationService,
  ReceivePixDepositUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type BankIspb = Bank['ispb'];

type TReceivePixDepositRequest = Pick<
  PixDeposit,
  | 'id'
  | 'amount'
  | 'txId'
  | 'endToEndId'
  | 'clientBranch'
  | 'clientAccountNumber'
  | 'clientDocument'
  | 'clientName'
  | 'clientKey'
  | 'thirdPartBranch'
  | 'thirdPartAccountType'
  | 'thirdPartAccountNumber'
  | 'thirdPartDocument'
  | 'thirdPartName'
  | 'thirdPartKey'
  | 'description'
> & { clientBankIspb: BankIspb; thirdPartBankIspb: BankIspb };

export class ReceivePixDepositRequest
  extends AutoValidator
  implements TReceivePixDepositRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @Length(8, 8)
  clientBankIspb: BankIspb;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  clientBranch: string;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientName: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  clientKey: string;

  @IsString()
  @Length(8, 8)
  thirdPartBankIspb: BankIspb;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  thirdPartBranch: string;

  @IsOptional()
  @IsEnum(AccountType)
  thirdPartAccountType: AccountType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  thirdPartKey: string;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  description: string;

  constructor(props: TReceivePixDepositRequest) {
    super(props);
  }
}

type TReceivePixDepositResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export class ReceivePixDepositResponse
  extends AutoValidator
  implements TReceivePixDepositResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDepositState)
  state: PixDepositState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TReceivePixDepositResponse) {
    super(props);
  }
}

export class ReceivePixDepositController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixDepositRedisRepository: PixDepositCacheRepository,
    warningPixSkipListRedisRepository: WarningPixSkipListRepository,
    eventEmitter: PixDepositEventEmitterControllerInterface,
    operationService: OperationService,
    bankingService: BankingService,
    warningPixSkipListRepository: WarningPixSkipListRepository,
    pixPaymentOperationCurrencyTag: string,
    pixPaymentOperationNewPixReceivedTransactionTag: string,
    pixPaymentZroBankIspb: string,
  ) {
    this.logger = logger.child({ context: ReceivePixDepositController.name });

    const controllerEventEmitter = new PixDepositEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixDepositRedisRepository,
      warningPixSkipListRedisRepository,
      controllerEventEmitter,
      operationService,
      bankingService,
      warningPixSkipListRepository,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationNewPixReceivedTransactionTag,
      pixPaymentZroBankIspb,
    );
  }

  async execute(
    request: ReceivePixDepositRequest,
  ): Promise<ReceivePixDepositResponse> {
    this.logger.debug('Receive Pix Deposit request.', { request });

    const {
      id,
      amount,
      txId,
      endToEndId,
      clientBankIspb,
      clientBranch,
      clientAccountNumber,
      clientDocument,
      clientName,
      clientKey,
      thirdPartBankIspb,
      thirdPartBranch,
      thirdPartAccountType,
      thirdPartAccountNumber,
      thirdPartDocument,
      thirdPartName,
      thirdPartKey,
      description,
    } = request;

    const clientBank = new BankEntity({ ispb: clientBankIspb });
    const thirdPartBank = new BankEntity({ ispb: thirdPartBankIspb });

    const deposit = await this.usecase.execute(
      id,
      amount,
      txId,
      endToEndId,
      clientBank,
      clientBranch,
      clientAccountNumber,
      clientDocument,
      clientName,
      clientKey,
      thirdPartBank,
      thirdPartBranch,
      thirdPartAccountType,
      thirdPartAccountNumber,
      thirdPartDocument,
      thirdPartName,
      thirdPartKey,
      description,
    );

    if (!deposit) return null;

    const response = new ReceivePixDepositResponse({
      id: deposit.id,
      state: deposit.state,
      createdAt: deposit.createdAt,
    });

    this.logger.info('Receive Pix Deposit response.', { deposit: response });

    return response;
  }
}
