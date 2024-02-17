import { Logger } from 'winston';
import {
  PixDeposit,
  PixDepositCacheRepository,
  PixDepositState,
  WarningPixBlockListRepository,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitter,
  PixDepositInvalidStateException,
  WarningDepositChecker,
  WarningDepositCheck,
} from '@zro/pix-payments/application';

@WarningDepositCheck
export class HandleWarningPixDepositIsSuspectCpfEventUseCase extends WarningDepositChecker {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   * @param warningPixBlockListRepository Warning Pix Block List Repository.
   * @param pixDepositEventEmitter pix deposit event emmiter.
   */
  constructor(
    protected logger: Logger,
    protected readonly pixDepositCacheRepository: PixDepositCacheRepository,
    private readonly warningPixBlockListRepository: WarningPixBlockListRepository,
    protected readonly pixDepositEventEmitter: PixDepositEventEmitter,
  ) {
    super(logger, pixDepositCacheRepository, pixDepositEventEmitter);

    this.logger = logger.child({
      context: HandleWarningPixDepositIsSuspectCpfEventUseCase.name,
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

    const blockedCpfs = await this.warningPixBlockListRepository.getAllCpf();

    if (blockedCpfs.includes(deposit.thirdPartDocument)) {
      return false;
    }

    return true;
  }
}
