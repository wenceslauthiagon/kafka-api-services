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
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  HandleWaitingPixDepositEventUseCase as UseCase,
  PixDepositEvent,
  OperationService,
  ComplianceService,
} from '@zro/pix-payments/application';
import { Wallet } from '@zro/operations/domain';
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositRepository,
  PixDepositState,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
  WarningPixDepositEventEmitterController,
  WarningPixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleWaitingPixDepositEventRequest = Pick<
  PixDepositEvent,
  'id' | 'state' | 'amount' | 'thirdPartName'
> & { userId: UserId; walletId: WalletId };

export class HandleWaitingPixDepositEventRequest
  extends AutoValidator
  implements THandleWaitingPixDepositEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDepositState)
  state: PixDepositState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName?: string;

  constructor(props: THandleWaitingPixDepositEventRequest) {
    super(props);
  }
}

type THandleWaitingPixDepositEventResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export class HandleWaitingPixDepositEventResponse
  extends AutoValidator
  implements THandleWaitingPixDepositEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDepositState)
  state!: PixDepositState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleWaitingPixDepositEventResponse) {
    super(props);
  }
}

export class HandleWaitingPixDepositEventController {
  /**
   * Handler triggered when deposit received was added successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositRepository deposit repository.
   * @param warningPixDepositRepository warning pix deposit repository
   * @param operationService operation Service.
   * @param complianceService compliance Service.
   * @param warningPixDepositEventEmitter warning pix deposit event emmiter.
   * @param pixDepositEventEmitter pix deposit event emmiter.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   * @param pixPaymentOperationCurrencyTag Operation currency tag.
   * @param pixPaymentOperationNewPixReceivedTransactionTag Operation transaction tag.
   */
  constructor(
    private logger: Logger,
    pixDepositRepository: PixDepositRepository,
    warningPixDepositRepository: WarningPixDepositRepository,
    operationService: OperationService,
    complianceService: ComplianceService,
    warningPixDepositEventEmitter: WarningPixDepositEventEmitterControllerInterface,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    pixDepositCacheRepository: PixDepositCacheRepository,
    pixPaymentOperationCurrencyTag: string,
    pixPaymentOperationNewPixReceivedTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleWaitingPixDepositEventController.name,
    });

    const warningPixDepositControllerEventEmitter =
      new WarningPixDepositEventEmitterController(
        warningPixDepositEventEmitter,
      );

    const pixDepositControllerEventEmitter =
      new PixDepositEventEmitterController(pixDepositEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixDepositRepository,
      warningPixDepositRepository,
      operationService,
      complianceService,
      warningPixDepositControllerEventEmitter,
      pixDepositControllerEventEmitter,
      pixDepositCacheRepository,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationNewPixReceivedTransactionTag,
    );
  }

  async execute(
    request: HandleWaitingPixDepositEventRequest,
  ): Promise<HandleWaitingPixDepositEventResponse> {
    this.logger.debug('Handle received deposit event request.', { request });

    const { id } = request;

    const pixDeposit = await this.usecase.execute(id);

    if (!pixDeposit) return null;

    const response = new HandleWaitingPixDepositEventResponse({
      id: pixDeposit.id,
      state: pixDeposit.state,
      createdAt: pixDeposit.createdAt,
    });

    this.logger.info('Handle received deposit.', { pixDeposit: response });

    return response;
  }
}
