import { Logger } from 'winston';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  Payment,
  PaymentRepository,
  PaymentState,
  AccountType,
} from '@zro/pix-payments/domain';
import { CancelPaymentByOperationIdUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

interface TCancelPaymentByOperationIdRequest {
  userId: UserId;
  walletId: WalletId;
  operationId: OperationId;
}

export class CancelPaymentByOperationIdRequest
  extends AutoValidator
  implements TCancelPaymentByOperationIdRequest
{
  @IsUUID(4)
  userId!: UserId;

  @IsUUID(4)
  walletId!: WalletId;

  @IsUUID(4)
  operationId!: OperationId;

  constructor(props: TCancelPaymentByOperationIdRequest) {
    super(props);
  }
}

type TCancelPaymentByOperationIdResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt' | 'canceledAt' | 'paymentDate'
> & { type: AccountType };

export class CancelPaymentByOperationIdResponse
  extends AutoValidator
  implements TCancelPaymentByOperationIdResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format canceledAt',
  })
  canceledAt?: Date;

  constructor(props: TCancelPaymentByOperationIdResponse) {
    super(props);
  }
}

export class CancelPaymentByOperationIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CancelPaymentByOperationIdController.name,
    });

    const eventEmitter = new PaymentEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, paymentRepository, eventEmitter);
  }

  async execute(
    request: CancelPaymentByOperationIdRequest,
  ): Promise<CancelPaymentByOperationIdResponse> {
    this.logger.debug('Start cancel pix payment request.', { request });

    const { operationId, walletId } = request;

    const wallet = new WalletEntity({ uuid: walletId });
    const operation = new OperationEntity({ id: operationId });

    const payment = await this.usecase.execute(wallet, operation);

    if (!payment) return null;

    const response = new CancelPaymentByOperationIdResponse({
      id: payment.id,
      type: payment.beneficiaryAccountType,
      state: payment.state,
      createdAt: payment.createdAt,
      canceledAt: payment.canceledAt,
      paymentDate: payment.paymentDate,
    });

    this.logger.info('Start cancel pix payment response.', {
      payment: response,
    });

    return response;
  }
}
