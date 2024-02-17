import { Logger } from 'winston';
import { isCnpj } from '@zro/common';
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
  WarningPixDepositBankBlockListRepository,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitter,
  PixDepositInvalidStateException,
  WarningDepositChecker,
  WarningDepositCheck,
} from '@zro/pix-payments/application';

@WarningDepositCheck
export class HandleWarningPixDepositIsSuspectBankEventUseCase extends WarningDepositChecker {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   * @param warningPixDepositBankBlockListRepository Warning Pix Block List Repository.
   * @param pixDepositEventEmitter pix deposit event emmiter.
   */
  constructor(
    protected logger: Logger,
    protected readonly pixDepositCacheRepository: PixDepositCacheRepository,
    private readonly warningPixDepositBankBlockListRepository: WarningPixDepositBankBlockListRepository,
    protected readonly pixDepositEventEmitter: PixDepositEventEmitter,
  ) {
    super(logger, pixDepositCacheRepository, pixDepositEventEmitter);

    this.logger = logger.child({
      context: HandleWarningPixDepositIsSuspectBankEventUseCase.name,
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

    if (isCnpj(deposit.thirdPartDocument)) {
      const bankFound =
        await this.warningPixDepositBankBlockListRepository.getByCnpj(
          deposit.thirdPartDocument,
        );

      if (bankFound) {
        return false;
      }
    }

    return true;
  }
}
