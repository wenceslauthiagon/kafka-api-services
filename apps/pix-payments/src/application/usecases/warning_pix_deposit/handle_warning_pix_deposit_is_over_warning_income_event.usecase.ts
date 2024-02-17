import { Logger } from 'winston';
import {
  PixDepositCacheRepository,
  PixDeposit,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  UserService,
  PixDepositEventEmitter,
  PixDepositInvalidStateException,
  WarningDepositChecker,
  WarningDepositCheck,
} from '@zro/pix-payments/application';

@WarningDepositCheck
export class HandleWarningPixDepositIsOverWarningIncomeEventUseCase extends WarningDepositChecker {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   * @param userService user Service.
   * @param pixDepositEventEmitter Pix deposit event emmiter.
   * @param warningPixDepositMaxOccupationIncome Maximum occupation income to be considered a warning pix.
   * @param warningPixDepositMinAmountToWarningIncome Minimum pix deposit amount to warning occupation income.
   */
  constructor(
    protected logger: Logger,
    protected readonly pixDepositCacheRepository: PixDepositCacheRepository,
    private readonly userService: UserService,
    protected readonly pixDepositEventEmitter: PixDepositEventEmitter,
    private readonly warningPixDepositMaxOccupationIncome: number,
    private readonly warningPixDepositMinAmountToWarningIncome: number,
  ) {
    super(logger, pixDepositCacheRepository, pixDepositEventEmitter);

    this.logger = logger.child({
      context: HandleWarningPixDepositIsOverWarningIncomeEventUseCase.name,
    });
  }

  async check(deposit: PixDeposit): Promise<boolean> {
    if (
      ![PixDepositState.NEW, PixDepositState.WAITING].includes(deposit.state)
    ) {
      throw new PixDepositInvalidStateException(deposit);
    }

    if (deposit.state !== PixDepositState.WAITING) {
      deposit.state = PixDepositState.WAITING;

      await this.pixDepositCacheRepository.update(deposit);
    }

    return this.isOverWarningOccupationIncome(deposit);
  }

  async isOverWarningOccupationIncome(deposit: PixDeposit): Promise<boolean> {
    const onBoarding =
      await this.userService.getOnboardingByUserAndStatusIsFinished(
        deposit.user,
      );

    this.logger.debug('Get user OnBoarding.', { onBoarding });

    if (
      onBoarding.occupationIncome <=
        this.warningPixDepositMaxOccupationIncome &&
      deposit.amount >= this.warningPixDepositMinAmountToWarningIncome
    )
      return false;

    return true;
  }
}
