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
  HandleWarningPixDepositIsSuspectBankEventUseCase as UseCase,
  PixDepositEvent,
} from '@zro/pix-payments/application';
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
  WarningPixDepositBankBlockListRepository,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { Wallet } from '@zro/operations/domain';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleWarningPixDepositIsSuspectBankEventRequest = Pick<
  PixDepositEvent,
  'id' | 'state' | 'amount' | 'thirdPartName'
> & { userId: UserId; walletId: WalletId };

export class HandleWarningPixDepositIsSuspectBankEventRequest
  extends AutoValidator
  implements THandleWarningPixDepositIsSuspectBankEventRequest
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

  constructor(props: THandleWarningPixDepositIsSuspectBankEventRequest) {
    super(props);
  }
}

type THandleWarningPixDepositIsSuspectBankEventResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export class HandleWarningPixDepositIsSuspectBankEventResponse
  extends AutoValidator
  implements THandleWarningPixDepositIsSuspectBankEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDepositState)
  state!: PixDepositState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleWarningPixDepositIsSuspectBankEventResponse) {
    super(props);
  }
}

export class HandleWarningPixDepositIsSuspectBankEventController {
  /**
   * Handler triggered when deposit received was added successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Cache Repository.
   * @param warningPixDepositBankBlockListRepository Warning Pix Deposit Bank Block List Repository.
   * @param pixDepositEventEmitter Pix Deposit Event Emitter.
   */
  constructor(
    private logger: Logger,
    pixDepositCacheRepository: PixDepositCacheRepository,
    warningPixDepositBankBlockListRepository: WarningPixDepositBankBlockListRepository,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleWarningPixDepositIsSuspectBankEventController.name,
    });

    const eventEmitter = new PixDepositEventEmitterController(
      pixDepositEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixDepositCacheRepository,
      warningPixDepositBankBlockListRepository,
      eventEmitter,
    );
  }

  async execute(
    request: HandleWarningPixDepositIsSuspectBankEventRequest,
  ): Promise<HandleWarningPixDepositIsSuspectBankEventResponse> {
    this.logger.debug('Handle received deposit event request.', { request });

    const { id } = request;

    const pixDeposit = await this.usecase.execute(id);

    if (!pixDeposit) return null;

    const response = new HandleWarningPixDepositIsSuspectBankEventResponse({
      id: pixDeposit.id,
      state: pixDeposit.state,
      createdAt: pixDeposit.createdAt,
    });

    this.logger.info('Handle received deposit.', { pixDeposit: response });

    return response;
  }
}
