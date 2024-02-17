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
  SanitizeHtml,
  MaxValue,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import {
  Payment,
  PaymentEntity,
  PaymentRepository,
  PaymentState,
  TPaymentRequestKey,
} from '@zro/pix-payments/domain';
import { DecodedPixKey, DecodedPixKeyEntity } from '@zro/pix-keys/domain';
import {
  CreateByPixKeyPaymentUseCase as UseCase,
  UserService,
  OperationService,
  BankingService,
  PixKeyService,
} from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];
type DecodedPixKeyId = DecodedPixKey['id'];

export class CreateByPixKeyPaymentRequest
  extends AutoValidator
  implements TPaymentRequestKey
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  userId!: UserId;

  @IsUUID(4)
  walletId!: WalletId;

  @IsUUID(4)
  decodedPixKeyId!: DecodedPixKeyId;

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

  constructor(props: TPaymentRequestKey) {
    super(props);
  }
}

type TCreateByPixKeyPaymentResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt' | 'value' | 'description' | 'paymentDate'
> & { operationId?: OperationId };

export class CreateByPixKeyPaymentResponse
  extends AutoValidator
  implements TCreateByPixKeyPaymentResponse
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

  constructor(props: TCreateByPixKeyPaymentResponse) {
    super(props);
  }
}

export class CreateByPixKeyPaymentController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    paymentServiceEventEmitter: PaymentEventEmitterControllerInterface,
    pixKeyService: PixKeyService,
    userService: UserService,
    operationService: OperationService,
    bankingService: BankingService,
    private pixPaymentOperationCurrencyTag: string,
    private pixPaymentOperationSendKeyTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: CreateByPixKeyPaymentController.name,
    });

    const paymentEventEmitter = new PaymentEventEmitterController(
      paymentServiceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      paymentRepository,
      paymentEventEmitter,
      pixKeyService,
      userService,
      operationService,
      bankingService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationSendKeyTransactionTag,
    );
  }

  async execute(
    request: CreateByPixKeyPaymentRequest,
  ): Promise<CreateByPixKeyPaymentResponse> {
    this.logger.debug('Create Pix Payment by Pix Key request.', { request });

    const user = new UserEntity({ uuid: request.userId });
    const wallet = new WalletEntity({ uuid: request.walletId });
    const payload = new PaymentEntity(request);
    payload.decodedPixKey = new DecodedPixKeyEntity({
      id: request.decodedPixKeyId,
    });

    const payment = await this.usecase.execute(user, wallet, payload);

    if (!payment) return null;

    const response = new CreateByPixKeyPaymentResponse({
      id: payment.id,
      operationId: payment.operation?.id,
      state: payment.state,
      value: payment.value,
      paymentDate: payment.paymentDate,
      description: payment.description,
      createdAt: payment.createdAt,
    });

    this.logger.info('Create Pix Payment by Pix Key response.', {
      payment: response,
    });

    return response;
  }
}
