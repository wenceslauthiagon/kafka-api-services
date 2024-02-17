import { Logger } from 'winston';
import { createHash } from 'crypto';
import { Bank } from '@zro/banking/domain';
import {
  PixDepositCacheRepository,
  PixDeposit,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitter,
  PixDepositInvalidStateException,
  WarningDepositChecker,
  WarningDepositCheck,
} from '@zro/pix-payments/application';

type DepositHashInformation = Pick<
  PixDeposit,
  | 'amount'
  | 'clientAccountNumber'
  | 'thirdPartAccountNumber'
  | 'thirdPartBranch'
> & { thirdPartIspb: Bank['ispb'] };

@WarningDepositCheck
export class HandleWarningPixDepositIsDuplicatedEventUseCase extends WarningDepositChecker {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   * @param pixDepositEventEmitter Pix deposit event emmiter.
   * @param warningPixDepositMinAmount Deposit minimum amount to be considered a warning pix.
   */
  constructor(
    protected logger: Logger,
    protected readonly pixDepositCacheRepository: PixDepositCacheRepository,
    protected readonly pixDepositEventEmitter: PixDepositEventEmitter,
    private readonly warningPixDepositMinAmount: number,
  ) {
    super(logger, pixDepositCacheRepository, pixDepositEventEmitter);

    this.logger = logger.child({
      context: HandleWarningPixDepositIsDuplicatedEventUseCase.name,
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

    if (deposit.amount <= this.warningPixDepositMinAmount) {
      return true;
    }

    return this.getSameDepositIn24Hours(deposit);
  }

  async getSameDepositIn24Hours(deposit: PixDeposit): Promise<boolean> {
    const hashInformation: DepositHashInformation = {
      clientAccountNumber: deposit.clientAccountNumber,
      thirdPartAccountNumber: deposit.thirdPartAccountNumber,
      amount: deposit.amount,
      thirdPartBranch: deposit.thirdPartBranch,
      thirdPartIspb: deposit.thirdPartBank.ispb,
    };

    const hash = createHash('sha1')
      .update(JSON.stringify(hashInformation))
      .digest('base64');

    // Seach for same deposit in past 24 hrs
    const foundDeposit = await this.pixDepositCacheRepository.getByHash(hash);

    if (foundDeposit) {
      this.logger.debug('Found similar deposit in past 24 hours.', {
        foundDeposit,
      });

      return false;
    }

    await this.pixDepositCacheRepository.createHash(hash, deposit);

    this.logger.debug('Deposit hash created.', { hash });

    return true;
  }
}
