import { Logger } from 'winston';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfractionRefundOperationRepository,
  PixDepositState,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import {
  HandleCreatePixInfractionRefundOperationUseCase as UseCase,
  OperationService,
} from '@zro/pix-payments/application';
import { User, UserEntity } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';

type THandleCreatePixInfractionRefundOperationEventRequest = {
  refundOperationId: Operation['id'];
  id: string;
  state: PixDepositState | PixDevolutionReceivedState;
  amount: number;
  userId: User['uuid'];
  walletId: Wallet['uuid'];
};

export class HandleCreatePixInfractionRefundOperationEventRequest
  extends AutoValidator
  implements THandleCreatePixInfractionRefundOperationEventRequest
{
  @IsUUID(4)
  refundOperationId: Operation['id'];

  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  state: PixDepositState | PixDevolutionReceivedState;

  @IsUUID(4)
  userId: User['uuid'];

  @IsUUID(4)
  walletId: Wallet['uuid'];

  @IsInt()
  @IsPositive()
  amount: number;

  constructor(props: THandleCreatePixInfractionRefundOperationEventRequest) {
    super(props);
  }
}

export class HandleCreatePixInfractionRefundOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    operationService: OperationService,
    pixPaymentOperationCurrencyTag: string,
    pixPaymentOperationRefundTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleCreatePixInfractionRefundOperationController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      pixInfractionRefundOperationRepository,
      operationService,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationRefundTransactionTag,
    );
  }

  async execute(
    request: HandleCreatePixInfractionRefundOperationEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Handle create pix infraction refund operation request.',
      {
        request,
      },
    );

    const { refundOperationId, id, state, userId, walletId, amount } = request;

    const user = new UserEntity({
      uuid: userId,
    });
    const wallet = new WalletEntity({
      uuid: walletId,
      user,
    });

    await this.usecase.execute(
      refundOperationId,
      id,
      state,
      user,
      wallet,
      amount,
    );

    this.logger.info('Handle create pix infraction refund operation finished.');
  }
}
