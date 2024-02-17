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
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
  WarningPixBlockListRepository,
} from '@zro/pix-payments/domain';
import { Wallet } from '@zro/operations/domain';
import {
  HandleWarningPixDepositIsSuspectCpfEventUseCase as UseCase,
  PixDepositEvent,
} from '@zro/pix-payments/application';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleWarningPixDepositIsSuspectCpfEventRequest = Pick<
  PixDepositEvent,
  'id' | 'state' | 'amount' | 'thirdPartName'
> & { userId: UserId; walletId: WalletId };

export class HandleWarningPixDepositIsSuspectCpfEventRequest
  extends AutoValidator
  implements THandleWarningPixDepositIsSuspectCpfEventRequest
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

  constructor(props: THandleWarningPixDepositIsSuspectCpfEventRequest) {
    super(props);
  }
}

type THandleWarningPixDepositIsSuspectCpfEventResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export class HandleWarningPixDepositIsSuspectCpfEventResponse
  extends AutoValidator
  implements THandleWarningPixDepositIsSuspectCpfEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDepositState)
  state!: PixDepositState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleWarningPixDepositIsSuspectCpfEventResponse) {
    super(props);
  }
}

export class HandleWarningPixDepositIsSuspectCpfEventController {
  /**
   * Handler triggered when deposit received was added successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Cache Repository.
   * @param warningPixBlockListRepository Warning Pix Block List Repository.
   * @param pixDepositEventEmitter Pix Deposit Event Emitter.
   */
  constructor(
    private logger: Logger,
    pixDepositCacheRepository: PixDepositCacheRepository,
    warningPixBlockListRepository: WarningPixBlockListRepository,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleWarningPixDepositIsSuspectCpfEventController.name,
    });

    const eventEmitter = new PixDepositEventEmitterController(
      pixDepositEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixDepositCacheRepository,
      warningPixBlockListRepository,
      eventEmitter,
    );
  }

  async execute(
    request: HandleWarningPixDepositIsSuspectCpfEventRequest,
  ): Promise<HandleWarningPixDepositIsSuspectCpfEventResponse> {
    this.logger.debug('Handle received deposit event request.', { request });

    const { id } = request;

    const pixDeposit = await this.usecase.execute(id);

    if (!pixDeposit) return null;

    const response = new HandleWarningPixDepositIsSuspectCpfEventResponse({
      id: pixDeposit.id,
      state: pixDeposit.state,
      createdAt: pixDeposit.createdAt,
    });

    this.logger.info('Handle received deposit.', { pixDeposit: response });

    return response;
  }
}
