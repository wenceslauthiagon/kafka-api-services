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
} from '@zro/pix-payments/domain';
import { Wallet } from '@zro/operations/domain';
import {
  HandleWarningPixDepositIsOverWarningIncomeEventUseCase as UseCase,
  PixDepositEvent,
  UserService,
} from '@zro/pix-payments/application';
import {
  PixDepositEventEmitterController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleWarningPixDepositIsOverWarningIncomeEventRequest = Pick<
  PixDepositEvent,
  'id' | 'state' | 'amount' | 'thirdPartName'
> & { userId: UserId; walletId: WalletId };

export class HandleWarningPixDepositIsOverWarningIncomeEventRequest
  extends AutoValidator
  implements THandleWarningPixDepositIsOverWarningIncomeEventRequest
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

  constructor(props: THandleWarningPixDepositIsOverWarningIncomeEventRequest) {
    super(props);
  }
}

type THandleWarningPixDepositIsOverWarningIncomeEventResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export class HandleWarningPixDepositIsOverWarningIncomeEventResponse
  extends AutoValidator
  implements THandleWarningPixDepositIsOverWarningIncomeEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDepositState)
  state!: PixDepositState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleWarningPixDepositIsOverWarningIncomeEventResponse) {
    super(props);
  }
}

export class HandleWarningPixDepositIsOverWarningIncomeEventController {
  /**
   * Handler triggered when deposit received was added successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Cache Repository.
   * @param userService user Service.
   * @param pixDepositEventEmitter Pix Deposit Event Emitter.
   * @param warningPixDepositMaxOccupationIncome Maximum occupation income to be considered a warning pix.
   * @param warningPixDepositMinAmountToWarningIncome Minimum pix deposit amount to warning occupation income.
   */
  constructor(
    private logger: Logger,
    pixDepositCacheRepository: PixDepositCacheRepository,
    userService: UserService,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    warningPixDepositMaxOccupationIncome: number,
    warningPixDepositMinAmountToWarningIncome: number,
  ) {
    this.logger = logger.child({
      context: HandleWarningPixDepositIsOverWarningIncomeEventController.name,
    });

    const eventEmitter = new PixDepositEventEmitterController(
      pixDepositEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixDepositCacheRepository,
      userService,
      eventEmitter,
      warningPixDepositMaxOccupationIncome,
      warningPixDepositMinAmountToWarningIncome,
    );
  }

  async execute(
    request: HandleWarningPixDepositIsOverWarningIncomeEventRequest,
  ): Promise<HandleWarningPixDepositIsOverWarningIncomeEventResponse> {
    this.logger.debug('Handle received deposit event request.', { request });

    const { id } = request;

    const pixDeposit = await this.usecase.execute(id);

    if (!pixDeposit) return null;

    const response =
      new HandleWarningPixDepositIsOverWarningIncomeEventResponse({
        id: pixDeposit.id,
        state: pixDeposit.state,
        createdAt: pixDeposit.createdAt,
      });

    this.logger.info('Handle received deposit.', { pixDeposit: response });

    return response;
  }
}
