import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  BankingTed,
  BankingTedFailureEntity,
  BankingTedFailureRepository,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import {
  CurrencyEntity,
  Operation,
  OperationEntity,
} from '@zro/operations/domain';
import {
  BankingTedEventEmitter,
  BankingTedNotFoundException,
  BankingTedInvalidStateException,
  OperationService,
} from '@zro/banking/application';
import {
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';

export class RejectBankingTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bankingTedRepository bankingTed repository.
   * @param bankingTedFailureRepository bankingTedFailure repository.
   * @param eventEmitter bankingTed event emitter.
   * @param operationService Operation service gateway.
   * @param bankingTedOperationCurrencyTag REAL Currency tag.
   * @param bankingTedFailureOperationTransactionTag TEDFAILURE Transaction tag.
   * @param bankingTedFailureOperationDescription TED FAILURE Description.
   */
  constructor(
    private logger: Logger,
    private readonly bankingTedRepository: BankingTedRepository,
    private readonly bankingTedFailureRepository: BankingTedFailureRepository,
    private readonly eventEmitter: BankingTedEventEmitter,
    private readonly operationService: OperationService,
    private readonly bankingTedOperationCurrencyTag: string,
    private readonly bankingTedFailureOperationTransactionTag: string,
    private readonly bankingTedFailureOperationDescription: string,
  ) {
    this.logger = logger.child({ context: RejectBankingTedUseCase.name });
  }

  async execute(
    id: number,
    code?: string,
    message?: string,
  ): Promise<BankingTed> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['Transaction ID']);
    }

    // Search bankingTed
    const bankingTed = await this.bankingTedRepository.getById(id);

    this.logger.debug('Found bankingTed.', { bankingTed });

    if (!bankingTed) {
      throw new BankingTedNotFoundException({ id });
    }

    // Indepotent
    if (bankingTed.isAlreadyFailedBankingTed()) {
      return bankingTed;
    }

    // CONFIRMED and FORWARDED bankingTed is accept.
    if (
      ![BankingTedState.CONFIRMED, BankingTedState.FORWARDED].includes(
        bankingTed.state,
      )
    ) {
      throw new BankingTedInvalidStateException(bankingTed);
    }

    // Create reversal operation
    const reversal = await this.createAndAcceptReversalOperation(bankingTed);

    this.logger.debug('Revert bankingTed for confirmed bankingTed.', {
      bankingTed,
    });

    // bankingTed is failed.
    bankingTed.state = BankingTedState.FAILED;
    bankingTed.failedAt = new Date();

    // Update bankingTed
    await this.bankingTedRepository.update(bankingTed);

    const newBankingTedFailure = new BankingTedFailureEntity({
      operation: reversal,
      transactionId: bankingTed.transactionId,
      bankingTed: bankingTed,
      failureCode: code,
      failureMessage: message,
    });

    await this.bankingTedFailureRepository.create(newBankingTedFailure);

    // Fire FailedBankingTed
    this.eventEmitter.failedBankingTed(bankingTed);

    this.logger.debug('Updated bankingTed with failed status.', { bankingTed });

    return bankingTed;
  }

  private async createAndAcceptReversalOperation(
    bankingTed: BankingTed,
  ): Promise<Operation> {
    // Get beneficiary default wallet
    const beneficiaryWallet =
      await this.operationService.getWalletByUserAndDefaultIsTrue(
        bankingTed.user,
      );

    if (!beneficiaryWallet) {
      this.logger.debug('BeneficiaryWallet not found.', {
        user: bankingTed.user,
      });
      throw new WalletNotFoundException({ user: bankingTed.user });
    }
    if (!beneficiaryWallet.isActive()) {
      this.logger.debug('BeneficiaryWallet not active.', { beneficiaryWallet });
      throw new WalletNotActiveException(beneficiaryWallet);
    }

    // Create operation without owner
    const operation = new OperationEntity({
      id: uuidV4(),
      rawValue: bankingTed.amount,
      currency: new CurrencyEntity({
        tag: this.bankingTedOperationCurrencyTag,
      }),
      description: this.bankingTedFailureOperationDescription,
    });

    await this.operationService.createAndAcceptOperation(
      this.bankingTedFailureOperationTransactionTag,
      operation,
      null,
      beneficiaryWallet,
    );

    return operation;
  }
}
