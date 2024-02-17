import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  Operation,
  OperationRepository,
  OperationState,
  WalletAccount,
  WalletAccountRepository,
  WalletAccountTransaction,
  WalletAccountTransactionEntity,
  WalletAccountTransactionRepository,
  WalletAccountTransactionType,
} from '@zro/operations/domain';
import {
  OperationNotFoundException,
  OperationInvalidStateException,
  WalletAccountNotFoundException,
  OperationEventEmitter,
  WalletAccountNotActiveException,
} from '@zro/operations/application';

export interface AcceptedOperation {
  operation: Operation;
  creditWalletAccountTransaction?: WalletAccountTransaction;
  creditWalletAccount?: WalletAccount;
  debitWalletAccountTransaction?: WalletAccountTransaction;
  debitWalletAccount?: WalletAccount;
}

export class AcceptOperationUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param operationRepository Operation repository.
   * @param walletAccountRepository Wallet account repository.
   * @param walletAccountTransactionRepository Wallet account transaction repository.
   * @param eventEmitter Operation event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly walletAccountTransactionRepository: WalletAccountTransactionRepository,
    private readonly eventEmitter: OperationEventEmitter,
  ) {
    this.logger = logger.child({ context: AcceptOperationUseCase.name });
  }

  /**
   * Accept a pending operation.
   *
   * @param id Pending operation id.
   * @returns Object containing Operation, Wallet account transactions and Wallet accounts
   *
   * @throws {MissingDataException} If any parameter is missing.
   * @throws {OperationNotFoundException} If operation id was not found in database.
   * @throws {OperationInvalidStateException} If operation is not in pending state.
   * @throws {WalletAccountNotFoundException} If onwer or beneficiary wallet account were not found.
   */
  async execute(id: string): Promise<AcceptedOperation> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['Operation ID']);
    }

    // Search operation.
    const operation =
      await this.operationRepository.getWithTransactionTypeById(id);

    this.logger.debug('Operation found.', { operation });

    if (!operation) {
      throw new OperationNotFoundException(id);
    }

    // Check if operation is in valid state
    if (!operation.isPending()) {
      throw new OperationInvalidStateException(operation.state);
    }

    // Set as accepted.
    operation.state = OperationState.ACCEPTED;
    await this.operationRepository.update(operation);

    const result: AcceptedOperation = { operation };

    // Has owner info?
    if (operation.ownerWalletAccount) {
      // Load owner wallet account.
      const ownerWalletAccount = await this.walletAccountRepository.getById(
        operation.ownerWalletAccount.id,
      );

      this.logger.debug('OwnerWalletAccount found.', { ownerWalletAccount });

      // Sanity check
      if (!ownerWalletAccount) {
        // TODO: Send message to slack IT team
        throw new WalletAccountNotFoundException(operation.ownerWalletAccount);
      }
      if (!ownerWalletAccount.isActive()) {
        throw new WalletAccountNotActiveException(ownerWalletAccount);
      }

      const previousBalance =
        ownerWalletAccount.balance + ownerWalletAccount.pendingAmount;
      const updatedBalance = previousBalance - operation.value;

      // Create a transaction
      const walletAccountTransaction = new WalletAccountTransactionEntity({
        operation,
        walletAccount: ownerWalletAccount,
        transactionType: WalletAccountTransactionType.DEBIT,
        value: operation.value,
        previousBalance,
        updatedBalance,
      });

      // Store transaction.
      await this.walletAccountTransactionRepository.create(
        walletAccountTransaction,
      );

      this.logger.debug('Created DEBIT wallet account transaction.', {
        walletAccountTransaction,
      });

      // Update pending amount
      ownerWalletAccount.pendingAmount =
        ownerWalletAccount.pendingAmount - operation.value;

      // Store updates pending amount
      await this.walletAccountRepository.update(ownerWalletAccount);

      this.logger.debug('Owner wallet account updated.', {
        ownerWalletAccount,
      });

      result.debitWalletAccountTransaction = walletAccountTransaction;
      result.debitWalletAccount = ownerWalletAccount;
    }

    // Has beneficiary info?
    if (operation.beneficiaryWalletAccount) {
      // Load beneficiary wallet account.
      const beneficiaryWalletAccount =
        await this.walletAccountRepository.getById(
          operation.beneficiaryWalletAccount.id,
        );

      this.logger.debug('beneficiaryWalletAccount found.', {
        beneficiaryWalletAccount,
      });

      // Sanity check
      if (!beneficiaryWalletAccount) {
        // TODO: Send message to slack IT team
        throw new WalletAccountNotFoundException(
          operation.beneficiaryWalletAccount,
        );
      }
      if (!beneficiaryWalletAccount.isActive()) {
        throw new WalletAccountNotActiveException(beneficiaryWalletAccount);
      }

      const previousBalance =
        beneficiaryWalletAccount.balance +
        beneficiaryWalletAccount.pendingAmount;
      const updatedBalance = previousBalance + operation.value;

      // Create a transaction
      const walletAccountTransaction = new WalletAccountTransactionEntity({
        operation,
        walletAccount: beneficiaryWalletAccount,
        transactionType: WalletAccountTransactionType.CREDIT,
        value: operation.value,
        previousBalance,
        updatedBalance,
      });

      // Store transaction.
      await this.walletAccountTransactionRepository.create(
        walletAccountTransaction,
      );

      this.logger.debug('Created CREDIT wallet account transaction.', {
        walletAccountTransaction,
      });

      // Update balance
      beneficiaryWalletAccount.balance =
        beneficiaryWalletAccount.balance + operation.value;

      // Store updated balance
      await this.walletAccountRepository.update(beneficiaryWalletAccount);

      this.logger.debug('Beneficiary wallet account updated.', {
        beneficiaryWalletAccount,
      });

      result.creditWalletAccountTransaction = walletAccountTransaction;
      result.creditWalletAccount = beneficiaryWalletAccount;
    }

    // Event emitter
    if (operation.ownerWalletAccount || operation.beneficiaryWalletAccount) {
      this.eventEmitter.acceptedOperation({
        ...(operation.ownerWalletAccount && { ownerOperation: operation }),
        ...(operation.beneficiaryWalletAccount && {
          beneficiaryOperation: operation,
        }),
      });
    }

    return result;
  }
}
