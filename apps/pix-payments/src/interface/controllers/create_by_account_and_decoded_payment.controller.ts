import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  IsUUID,
  IsOptional,
  IsEnum,
  Length,
  ValidateIf,
  IsString,
  MaxLength,
  IsInt,
  IsPositive,
} from 'class-validator';
import {
  AutoValidator,
  isCpf,
  isCnpj,
  MaxValue,
  SanitizeHtml,
  IsIsoStringDateFormat,
} from '@zro/common';
import { User, PersonType } from '@zro/users/domain';
import {
  AccountType,
  DecodedPixAccountRepository,
  DecodedPixAccount,
  Payment,
  PaymentState,
  PaymentRepository,
} from '@zro/pix-payments/domain';
import { Bank } from '@zro/banking/domain';
import {
  BankingService,
  KycGateway,
  OperationService,
  UserService,
} from '@zro/pix-payments/application';
import {
  DecodedPixAccountEventEmitterControllerInterface,
  PaymentEventEmitterControllerInterface,
  CreateDecodedPixAccountController,
  CreateByAccountPaymentController,
} from '@zro/pix-payments/interface';
import { Operation, Wallet } from '@zro/operations/domain';

type UserId = User['uuid'];
type BankIspb = Bank['ispb'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TCreateByAccountAndDecodedPaymentRequest = Pick<
  DecodedPixAccount,
  'id' | 'personType' | 'document' | 'branch' | 'accountNumber' | 'accountType'
> &
  Pick<Payment, 'value' | 'description' | 'paymentDate'> & {
    userId: UserId;
    bankIspb: BankIspb;
    walletId: WalletId;
  };

export class CreateByAccountAndDecodedPaymentRequest
  extends AutoValidator
  implements TCreateByAccountAndDecodedPaymentRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  walletId!: WalletId;

  @IsUUID(4)
  userId: UserId;

  @IsEnum(PersonType)
  personType: PersonType;

  @ValidateIf(
    (obj, val) =>
      (obj.personType === PersonType.NATURAL_PERSON && isCpf(val)) ||
      (obj.personType === PersonType.LEGAL_PERSON && isCnpj(val)),
  )
  @IsString()
  document: string;

  @IsString()
  @Length(8, 8)
  bankIspb: BankIspb;

  @IsString()
  @Length(4, 4)
  branch: string;

  @IsString()
  @MaxLength(255)
  accountNumber: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsInt()
  @IsPositive()
  @MaxValue(1e18)
  value!: number;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  constructor(props: TCreateByAccountAndDecodedPaymentRequest) {
    super(props);
  }
}

type TCreateByAccountAndDecodedPaymentResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt' | 'value' | 'description' | 'paymentDate'
> & { operationId?: OperationId };

export class CreateByAccountAndDecodedPaymentResponse
  extends AutoValidator
  implements TCreateByAccountAndDecodedPaymentResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  operationId?: OperationId;

  @IsInt()
  @IsPositive()
  value: number;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateByAccountAndDecodedPaymentResponse) {
    super(props);
  }
}

export class CreateByAccountAndDecodedPaymentController {
  private createByAccountPaymentController: CreateByAccountPaymentController;
  private createDecodedPixAccountController: CreateDecodedPixAccountController;

  constructor(
    private logger: Logger,
    kycGateway: KycGateway,
    paymentRepository: PaymentRepository,
    decodedPixAccountRepository: DecodedPixAccountRepository,
    paymentEventEmitter: PaymentEventEmitterControllerInterface,
    decodedPixAccountEventEmitter: DecodedPixAccountEventEmitterControllerInterface,
    userService: UserService,
    operationService: OperationService,
    bankingService: BankingService,
    private pixPaymentOperationCurrencyTag: string,
    private pixPaymentOperationSendAccountTransactionTag: string,
    private maxPerDay: number,
    private pixPaymentZroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: CreateByAccountAndDecodedPaymentController.name,
    });

    this.createByAccountPaymentController =
      new CreateByAccountPaymentController(
        this.logger,
        paymentRepository,
        decodedPixAccountRepository,
        paymentEventEmitter,
        decodedPixAccountEventEmitter,
        userService,
        operationService,
        this.pixPaymentOperationCurrencyTag,
        this.pixPaymentOperationSendAccountTransactionTag,
      );

    this.createDecodedPixAccountController =
      new CreateDecodedPixAccountController(
        this.logger,
        decodedPixAccountRepository,
        decodedPixAccountEventEmitter,
        bankingService,
        userService,
        this.maxPerDay,
        kycGateway,
        this.pixPaymentZroBankIspb,
      );
  }

  async execute(
    request: CreateByAccountAndDecodedPaymentRequest,
  ): Promise<CreateByAccountAndDecodedPaymentResponse> {
    this.logger.debug('Create by account and decoded payment request.', {
      request,
    });

    const {
      id,
      userId,
      personType,
      bankIspb,
      branch,
      accountNumber,
      accountType,
      document,
      walletId,
      value,
      description,
      paymentDate,
    } = request;

    const decodedPixAccount =
      await this.createDecodedPixAccountController.execute({
        id: uuidV4(),
        userId,
        personType,
        bankIspb,
        branch,
        accountNumber,
        accountType,
        document,
      });

    this.logger.info('Pix decode by account response.', {
      decodedPixAccount,
    });

    if (!decodedPixAccount) return null;

    const payment = await this.createByAccountPaymentController.execute({
      id,
      userId,
      walletId,
      decodedPixAccountId: decodedPixAccount.id,
      value,
      description,
      paymentDate,
    });

    if (!payment) return null;

    const response = new CreateByAccountAndDecodedPaymentResponse({
      id: payment.id,
      operationId: payment.operationId,
      state: payment.state,
      value: payment.value,
      paymentDate: payment.paymentDate,
      description: payment.description,
      createdAt: payment.createdAt,
    });

    this.logger.info('Create pix account payment response.', {
      payment: response,
    });

    return response;
  }
}
