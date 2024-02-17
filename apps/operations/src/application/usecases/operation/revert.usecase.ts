import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  Operation,
  OperationRepository,
  OperationState,
  WalletAccountRepository,
} from '@zro/operations/domain';
import {
  OperationNotFoundException,
  OperationInvalidStateException,
  WalletAccountNotFoundException,
  OperationEventEmitter,
  WalletAccountNotActiveException,
} from '@zro/operations/application';

/**
 * Revert a pending operation. Pending amount and balance are reverted.
 */
export class RevertOperationUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param operationRepository Operation repository.
   * @param walletAccountRepository Wallet account repository.
   * @param eventEmitter Operation event emitter.
   */
  constructor(
    private readonly logger: Logger,
    private readonly operationRepository: OperationRepository,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly eventEmitter: OperationEventEmitter,
  ) {
    this.logger = logger.child({ context: RevertOperationUseCase.name });
  }

  /**
   * Revert a pending operation.
   *
   * @param id Pending operation id.
   * @returns Object containing operation and wallet account.
   *
   * @throws {MissingDataException} If any parameter is missing.
   * @throws {OperationNotFoundException} If operation id was not found in database.
   * @throws {OperationInvalidStateException} If operation is not in pending state.
   * @throws {WalletAccountNotFoundException} If onwer wallet account were not found.
   * @throws {OperationNotReversibleException} If operation has no owner wallet.
   */
  async execute(id: string): Promise<Operation> {
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

    // Indepotent revert?
    if (operation.isReverted()) {
      return operation;
    }

    // Check if operation is in valid state
    if (!operation.isPending()) {
      throw new OperationInvalidStateException(operation.state);
    }

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

      // Revert pending amount
      ownerWalletAccount.pendingAmount =
        ownerWalletAccount.pendingAmount - operation.value;

      // Revert balance
      ownerWalletAccount.balance = ownerWalletAccount.balance + operation.value;

      // Store updates pending amount
      await this.walletAccountRepository.update(ownerWalletAccount);

      this.logger.debug('OwnerWalletAccount updated.', { ownerWalletAccount });
    }

    // Set as reverted.
    operation.state = OperationState.REVERTED;
    operation.revertedAt = new Date();
    await this.operationRepository.update(operation);

    // Event emitter
    this.eventEmitter.revertedOperation({
      ...(operation.ownerWalletAccount && { ownerOperation: operation }),
      ...(operation.beneficiaryWalletAccount && {
        beneficiaryOperation: operation,
      }),
    });

    this.logger.debug('Operation reverted.', { operation });

    return operation;
  }
}
