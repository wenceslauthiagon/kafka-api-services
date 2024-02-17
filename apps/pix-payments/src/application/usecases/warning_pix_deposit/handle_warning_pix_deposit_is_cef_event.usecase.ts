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
export class HandleWarningPixDepositIsCefEventUseCase extends WarningDepositChecker {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositEventEmitter Pix Deposit Event Emitter.
   * @param pixPaymentCEFIspb CEF ispb.
   * @param warningPixDepositMinAmount Deposit minimum amount to be considered a warning pix.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   */
  constructor(
    protected logger: Logger,
    protected pixDepositCacheRepository: PixDepositCacheRepository,
    protected pixDepositEventEmitter: PixDepositEventEmitter,
    private pixPaymentCEFIspb: string,
    private warningPixDepositMinAmount: number,
  ) {
    super(logger, pixDepositCacheRepository, pixDepositEventEmitter);

    this.logger = logger.child({
      context: HandleWarningPixDepositIsCefEventUseCase.name,
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
      deposit.thirdPartBank.ispb == this.pixPaymentCEFIspb
    ) {
      return false;
    }

    return true;
  }
}
