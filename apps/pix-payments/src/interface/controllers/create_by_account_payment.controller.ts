import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  MaxValue,
  SanitizeHtml,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import {
  Payment,
  PaymentEntity,
  PaymentRepository,
  PaymentState,
  TPaymentRequestAccount,
  DecodedPixAccountRepository,
  DecodedPixAccountEntity,
  DecodedPixAccount,
} from '@zro/pix-payments/domain';
import {
  CreateByAccountPaymentUseCase as UseCase,
  UserService,
  OperationService,
} from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
  DecodedPixAccountEventEmitterController,
  DecodedPixAccountEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];
type DecodedPixAccountId = DecodedPixAccount['id'];

export class CreateByAccountPaymentRequest
  extends AutoValidator
  implements TPaymentRequestAccount
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  userId!: UserId;

  @IsUUID(4)
  walletId!: WalletId;

  @IsUUID(4)
  decodedPixAccountId!: DecodedPixAccountId;

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

  constructor(props: TPaymentRequestAccount) {
    super(props);
  }
}

type TCreateByAccountPaymentResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt' | 'value' | 'description' | 'paymentDate'
> & { operationId?: OperationId };

export class CreateByAccountPaymentResponse
  extends AutoValidator
  implements TCreateByAccountPaymentResponse
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

  constructor(props: TCreateByAccountPaymentResponse) {
    super(props);
  }
}

export class CreateByAccountPaymentController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    decodedPixAccountRepository: DecodedPixAccountRepository,
    servicePaymentEventEmitter: PaymentEventEmitterControllerInterface,
    serviceDecodedPixAccountEventEmitter: DecodedPixAccountEventEmitterControllerInterface,
    userService: UserService,
    operationService: OperationService,
    private pixPaymentOperationCurrencyTag: string,
    private pixPaymentOperationSendAccountTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: CreateByAccountPaymentController.name,
    });

    const paymentEventEmitter = new PaymentEventEmitterController(
      servicePaymentEventEmitter,
    );
    const decodedPixAccountEventEmitter =
      new DecodedPixAccountEventEmitterController(
        serviceDecodedPixAccountEventEmitter,
      );

    this.usecase = new UseCase(
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
  }

  async execute(
    request: CreateByAccountPaymentRequest,
  ): Promise<CreateByAccountPaymentResponse> {
    this.logger.debug('Create pix account payment request.', { request });

    const user = new UserEntity({ uuid: request.userId });
    const wallet = new WalletEntity({ uuid: request.walletId });
    const payload = new PaymentEntity(request);
    payload.decodedPixAccount = new DecodedPixAccountEntity({
      id: request.decodedPixAccountId,
    });

    const payment = await this.usecase.execute(user, wallet, payload);

    if (!payment) return null;

    const response = new CreateByAccountPaymentResponse({
      id: payment.id,
      operationId: payment.operation?.id,
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
