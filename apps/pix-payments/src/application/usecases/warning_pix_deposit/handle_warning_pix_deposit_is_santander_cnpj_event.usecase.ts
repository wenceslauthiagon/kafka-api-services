import { Logger } from 'winston';
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitter,
  PixDepositInvalidStateException,
  WarningDepositChecker,
  WarningDepositCheck,
} from '@zro/pix-payments/application';

@WarningDepositCheck
export class HandleWarningPixDepositIsSantanderCnpjEventUseCase extends WarningDepositChecker {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   * @param pixDepositEventEmitter pix deposit event emmiter.
   * @param pixPaymentSantanderIspb Santander ispb
   * @param warningPixDepositMinAmount Deposit minimum amount to be considered a warning pix.
   * @param warningPixDepositSantanderCnpj Santander account cpnj to be considered a warning pix.
   */
  constructor(
    protected logger: Logger,
    protected readonly pixDepositCacheRepository: PixDepositCacheRepository,
    protected readonly pixDepositEventEmitter: PixDepositEventEmitter,
    private readonly pixPaymentSantanderIspb: string,
    private readonly warningPixDepositMinAmount: number,
    private readonly warningPixDepositSantanderCnpj: string,
  ) {
    super(logger, pixDepositCacheRepository, pixDepositEventEmitter);

    this.logger = logger.child({
      context: HandleWarningPixDepositIsSantanderCnpjEventUseCase.name,
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

    if (
      deposit.amount > this.warningPixDepositMinAmount &&
      deposit.thirdPartBank.ispb == this.pixPaymentSantanderIspb &&
      deposit.thirdPartDocument == this.warningPixDepositSantanderCnpj
    ) {
      return false;
    }

    return true;
  }
}
