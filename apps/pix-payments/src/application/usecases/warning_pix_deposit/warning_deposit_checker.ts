import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixDeposit,
  PixDepositCacheRepository,
} from '@zro/pix-payments/domain';
import {
  PixDepositEventEmitter,
  PixDepositNotFoundException,
} from '@zro/pix-payments/application';

export function WarningDepositCheck<T extends new (...args: any[]) => any>(
  target: T,
): T {
  WarningDepositChecker.checkers++;

  return class extends target {
    constructor(...args: any[]) {
      super(...args);
      this.checkName = target.name;
    }
  };
}

export abstract class WarningDepositChecker {
  static readonly context = 'WarningDepositChecker';
  static checkers = 0;
  public checkName: string;

  constructor(
    protected logger: Logger,
    protected pixDepositCacheRepository: PixDepositCacheRepository,
    protected pixDepositEventEmitter: PixDepositEventEmitter,
  ) {}

  abstract check(deposit: PixDeposit): Promise<boolean>;

  async isInSkipList(deposit: PixDeposit): Promise<boolean> {
    if (!deposit) {
      throw new MissingDataException(['Deposit']);
    }

    return false;
  }

  async execute(id: string): Promise<PixDeposit> {
    this.logger = this.logger.child({ context: WarningDepositChecker.context });

    if (!id) {
      throw new MissingDataException(['ID']);
    }

    this.logger.debug(`Validating checker ${this.checkName}.`, {
      numChecker: WarningDepositChecker.checkers,
      id,
    });

    const checkedDeposit = await this.pixDepositCacheRepository.semaphore(
      id,
      async () => {
        return this.setResult(id);
      },
    );

    if (
      checkedDeposit.check &&
      Object.keys(checkedDeposit.check).length ===
        WarningDepositChecker.checkers
    ) {
      this.pixDepositEventEmitter.waitingDeposit(checkedDeposit);
    }

    return checkedDeposit;
  }

  // Result true means there is no warning. Result false means there is a warning.
  private async setResult(id: string): Promise<PixDeposit> {
    const deposit = await this.pixDepositCacheRepository.getById(id);

    if (!deposit) {
      throw new PixDepositNotFoundException({ id });
    }

    // If it is in the skip list, set result to true
    let result = true;

    if (!(await this.isInSkipList(deposit))) {
      result = await this.check(deposit);

      this.logger.debug(`Validating setResult ${this.checkName}.`, {
        result,
        id,
      });
    }

    if (!deposit.check) {
      deposit.check = {};
    }

    deposit.check[this.checkName] = result;

    const checkedDeposit = await this.pixDepositCacheRepository.update(deposit);

    this.logger.debug('PixDeposit updated.', { checkedDeposit });

    return checkedDeposit;
  }
}
