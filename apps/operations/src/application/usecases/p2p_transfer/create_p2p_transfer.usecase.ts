import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { isNumber } from 'class-validator';
import { ForbiddenException, MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Wallet,
  Currency,
  P2PTransfer,
  P2PTransferEntity,
  CurrencyRepository,
  P2PTransferRepository,
  OperationEntity,
} from '@zro/operations/domain';
import {
  CurrencyNotFoundException,
  CreateOperationParticipant,
  CreateOperationUseCase,
  CurrencyNotActiveException,
  AcceptOperationUseCase,
} from '@zro/operations/application';

export class CreateP2PTransferUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param p2pTransferRepository P2PTransfer repository.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private logger: Logger,
    private readonly p2pTransferRepository: P2PTransferRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly p2pTransactionTypeTag: string,
    private readonly createOperation: CreateOperationUseCase,
    private readonly acceptOperation: AcceptOperationUseCase,
    private readonly creditTransactionTypeTag: string,
    private readonly debitTransactionTypeTag: string,
    private readonly ZROWalletId: string,
  ) {
    this.logger = logger.child({ context: CreateP2PTransferUseCase.name });
  }

  async execute(
    id: string,
    user: User,
    wallet: Wallet,
    beneficiaryWallet: Wallet,
    amountCurrency: Currency,
    amount: number,
    fee = 0,
    description?: string,
  ): Promise<P2PTransfer> {
    // Data input check
    if (
      !id ||
      !user?.uuid ||
      !wallet?.uuid ||
      !beneficiaryWallet?.uuid ||
      !amountCurrency?.symbol ||
      !isNumber(amount)
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!beneficiaryWallet?.uuid ? ['Beneficiary Wallet'] : []),
        ...(!amountCurrency?.symbol ? ['Amount Currency'] : []),
        ...(!isNumber(amount) ? ['Amount'] : []),
      ]);
    }

    // Check indepotent
    const p2pTransfer = await this.p2pTransferRepository.getById(id);

    if (p2pTransfer) {
      this.logger.debug('P2PTransfer already exists.', { p2pTransfer });

      if (
        wallet.uuid === this.ZROWalletId ||
        p2pTransfer.wallet.uuid === wallet.uuid
      ) {
        return p2pTransfer;
      }

      throw new ForbiddenException();
    }

    // Check if amount currency exists
    const currency = await this.currencyRepository.getBySymbol(
      amountCurrency.symbol,
    );

    this.logger.debug('Amount currency found.', { currency });

    if (!currency) {
      throw new CurrencyNotFoundException(amountCurrency);
    }
    if (!currency.isActive()) {
      throw new CurrencyNotActiveException(amountCurrency);
    }

    let transactionTypeTag: string;
    let ownerInfo: CreateOperationParticipant = null;
    let beneficiaryInfo: CreateOperationParticipant = null;
    const operation = new OperationEntity({ id: uuidV4() });

    // Check if this p2p is a credit or debit operation.
    if (wallet.uuid === this.ZROWalletId) {
      transactionTypeTag = this.creditTransactionTypeTag;
      beneficiaryInfo = {
        operation,
        wallet: beneficiaryWallet,
        currency,
        rawValue: amount,
        fee,
        description: description ?? this.creditTransactionTypeTag,
      };
    } else if (beneficiaryWallet.uuid === this.ZROWalletId) {
      transactionTypeTag = this.debitTransactionTypeTag;
      ownerInfo = {
        operation,
        wallet,
        currency,
        rawValue: amount,
        fee,
        description: description ?? this.debitTransactionTypeTag,
      };
    } else {
      transactionTypeTag = this.p2pTransactionTypeTag;
      ownerInfo = {
        operation,
        wallet,
        currency,
        rawValue: amount,
        fee: 0, // Should exist only on beneficiary operation
        description: description ?? this.p2pTransactionTypeTag,
      };
      beneficiaryInfo = {
        operation,
        wallet: beneficiaryWallet,
        currency,
        rawValue: amount,
        fee,
        description: description ?? this.p2pTransactionTypeTag,
      };
    }

    const operationCreated = await this.createOperation.execute(
      transactionTypeTag,
      ownerInfo,
      beneficiaryInfo,
    );

    this.logger.debug('Operation created.', { operation: operationCreated });

    const accept = await this.acceptOperation.execute(operation.id);

    this.logger.debug('Operation accepted.', { operation: accept });

    const transfer = new P2PTransferEntity({
      id,
      user,
      wallet,
      beneficiaryWallet,
      operation,
      currency,
      amount,
      fee,
      description,
    });
    const result = await this.p2pTransferRepository.create(transfer);

    this.logger.debug('P2PTransfer created.', { result });

    return result;
  }
}
