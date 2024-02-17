import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Wallet, WalletEntity } from '@zro/operations/domain';
import {
  Payment,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import { GetPaymentByEndToEndIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type TGetPaymentByEndToEndIdRequest = Pick<Payment, 'endToEndId'> & {
  userId?: UserId;
  walletId?: WalletId;
};

export class GetPaymentByEndToEndIdRequest
  extends AutoValidator
  implements TGetPaymentByEndToEndIdRequest
{
  @IsString()
  @MaxLength(255)
  endToEndId: string;

  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  constructor(props: TGetPaymentByEndToEndIdRequest) {
    super(props);
  }
}

type TGetPaymentByEndToEndIdResponse = Pick<
  Payment,
  'id' | 'endToEndId' | 'txId' | 'value' | 'state' | 'createdAt'
>;

export class GetPaymentByEndToEndIdResponse
  extends AutoValidator
  implements TGetPaymentByEndToEndIdResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PaymentState)
  state: PaymentState;

  @IsInt()
  @Min(0)
  value: number;

  @IsString()
  @MaxLength(255)
  endToEndId: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetPaymentByEndToEndIdResponse) {
    super(props);
  }
}

export class GetPaymentByEndToEndIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
  ) {
    this.logger = logger.child({
      context: GetPaymentByEndToEndIdController.name,
    });

    this.usecase = new UseCase(this.logger, paymentRepository);
  }

  async execute(
    request: GetPaymentByEndToEndIdRequest,
  ): Promise<GetPaymentByEndToEndIdResponse> {
    this.logger.debug('Get Pix Payment by endToEndId request.', { request });

    const { endToEndId, userId, walletId } = request;

    const wallet = walletId && new WalletEntity({ uuid: walletId });
    const user = userId && new UserEntity({ uuid: userId });

    const payment = await this.usecase.execute(endToEndId, user, wallet);

    if (!payment) return null;

    const response = new GetPaymentByEndToEndIdResponse({
      id: payment.id,
      endToEndId: payment.endToEndId,
      txId: payment.txId,
      value: payment.value,
      state: payment.state,
      createdAt: payment.createdAt,
    });

    this.logger.info('Get Pix Payment by endToEndId response.', {
      payment: response,
    });

    return response;
  }
}
