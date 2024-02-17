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
import { Wallet } from '@zro/operations/domain';
import {
  HandleWarningPixDepositIsDuplicatedEventUseCase as UseCase,
  PixDepositEvent,
} from '@zro/pix-payments/application';
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleWarningPixDepositIsDuplicatedEventRequest = Pick<
  PixDepositEvent,
  'id' | 'state' | 'amount' | 'thirdPartName'
> & { userId: UserId; walletId: WalletId };

export class HandleWarningPixDepositIsDuplicatedEventRequest
  extends AutoValidator
  implements THandleWarningPixDepositIsDuplicatedEventRequest
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

  constructor(props: THandleWarningPixDepositIsDuplicatedEventRequest) {
    super(props);
  }
}

type THandleWarningPixDepositIsDuplicatedEventResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export class HandleWarningPixDepositIsDuplicatedEventResponse
  extends AutoValidator
  implements THandleWarningPixDepositIsDuplicatedEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDepositState)
  state!: PixDepositState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleWarningPixDepositIsDuplicatedEventResponse) {
    super(props);
  }
}

export class HandleWarningPixDepositIsDuplicatedEventController {
  /**
   * Handler triggered when deposit received was added successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Cache Repository.
   * @param pixDepositEventEmitter Pix deposit event emmiter.
   * @param warningPixDepositMinAmount Deposit minimum amount to be considered a warning pix.
   */
  constructor(
    private logger: Logger,
    pixDepositCacheRepository: PixDepositCacheRepository,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    warningPixDepositMinAmount: number,
  ) {
    this.logger = logger.child({
      context: HandleWarningPixDepositIsDuplicatedEventController.name,
    });

    const eventEmitter = new PixDepositEventEmitterController(
      pixDepositEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixDepositCacheRepository,
      eventEmitter,
      warningPixDepositMinAmount,
    );
  }

  async execute(
    request: HandleWarningPixDepositIsDuplicatedEventRequest,
  ): Promise<HandleWarningPixDepositIsDuplicatedEventResponse> {
    this.logger.debug('Handle received deposit event request.', { request });

    const { id } = request;

    const pixDeposit = await this.usecase.execute(id);

    if (!pixDeposit) return null;

    const response = new HandleWarningPixDepositIsDuplicatedEventResponse({
      id: pixDeposit.id,
      state: pixDeposit.state,
      createdAt: pixDeposit.createdAt,
    });

    this.logger.info('Handle received deposit.', { pixDeposit: response });

    return response;
  }
}
