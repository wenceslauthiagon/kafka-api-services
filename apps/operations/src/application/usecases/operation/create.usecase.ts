import { v4 as uuidV4 } from 'uuid';
import { Moment } from 'moment';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import {
  MissingDataException,
  InvalidDataFormatException,
  formatValueFromIntToFloat,
  formatValueFromFloatToInt,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Operation,
  TransactionType,
  UserLimit,
  Wallet,
  Currency,
  CurrencyRepository,
  TransactionTypeRepository,
  TransactionTypeState,
  WalletAccountRepository,
  OperationRepository,
  OperationEntity,
  OperationState,
  LimitTypeRepository,
  UserLimitRepository,
  WalletAccount,
  GlobalLimitRepository,
  UserLimitEntity,
  LimitTypePeriodStart,
  UsedLimit,
  LimitType,
  WalletAccountCacheRepository,
  CurrencyEntity,
  OperationStreamQuotationRepository,
  PendingWalletAccountTransactionRepository,
  PendingWalletAccountTransactionEntity,
  PendingWalletAccountTransaction,
  WalletAccountEntity,
  WalletRepository,
  UserLimitTrackerRepository,
  UserLimitTracker,
  UserLimitTrackerEntity,
  OperationAnalysisTag,
  LimitTypeCheck,
  getOperationLimitCheckStates,
} from '@zro/operations/domain';
import { StreamQuotationNotFoundException } from '@zro/quotations/application';
import {
  DataException,
  TransactionTypeTagNotFoundException,
  WalletAccountNotFoundException,
  CurrencyNotFoundException,
  NotEnoughLimitException,
  NotEnoughFundsException,
  NotEnoughAvailableLimitException,
  ValueAboveMaxAmountLimitException,
  ValueUnderMinAmountLimitException,
  TransactionTypeNotActiveException,
  ValueAboveMaxAmountNightlyLimitException,
  ValueUnderMinAmountNightlyLimitException,
  OperationEventEmitter,
  WalletNotFoundException,
  WalletNotActiveException,
  CurrencyNotActiveException,
  WalletAccountNotActiveException,
  UserLimitEventEmitter,
} from '@zro/operations/application';

export interface CreateOperationParticipant {
  /**
   * Operation. Client defined operation.
   */
  operation: Operation;

  /**
   * Wallet. Client defined wallet.
   */
  wallet: Wallet;

  /**
   * Operation currency.
   */
  currency: Currency;

  /**
   * Operation base value.
   */
  rawValue: number;

  /**
   * Operation fee.
   */
  fee: number;

  /**
   * Operation description.
   */
  description: string;

  /**
   * Operation enable use all wallet account balance.
   */
  ownerAllowAvailableRawValue?: boolean;

  /**
   * Operation ownerRequestedRawValue.
   */
  ownerRequestedRawValue?: number;

  /**
   * Operation ownerRequestedFee.
   */
  ownerRequestedFee?: number;
}

interface OperationInfo {
  /**
   * Operation owner data.
   */
  ownerInfo?: CreateOperationParticipant;

  /**
   * Operation owner wallet.
   */
  ownerWallet?: Wallet;

  /**
   * Owner wallet account.
   */
  ownerWalletAccount?: WalletAccount;

  /**
   * Operation beneficiary data.
   */
  beneficiaryInfo?: CreateOperationParticipant;

  /**
   * Operation beneficiary wallet
   */
  beneficiaryWallet?: Wallet;

  /**
   * Beneficiary wallet account.
   */
  beneficiaryWalletAccount?: WalletAccount;

  /**
   * Operation type.
   */
  transactionType: TransactionType;
}

export interface CreatedOperation {
  /**
   * Created operation to owner user.
   */
  ownerOperation?: Operation;

  /**
   * Created operation to beneficiary user.
   */
  beneficiaryOperation?: Operation;
}

export class CreateOperationUseCase {
  private pendingWalletAccountOwnerTransaction: PendingWalletAccountTransaction =
    null;
  private pendingWalletAccountBeneficiaryTransaction: PendingWalletAccountTransaction =
    null;
  private ownerUserLimitTracker: UserLimitTracker = null;
  private beneficiaryUserLimitTracker: UserLimitTracker = null;
  private currentMoment: Moment = null;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param transactionTypeRepository Transaction type repository.
   * @param currencyRepository Currency repository.
   * @param eventEmitter Operation event emitter.
   */
  constructor(
    private readonly logger: Logger,
    private readonly transactionTypeRepository: TransactionTypeRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly walletRepository: WalletRepository,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly operationRepository: OperationRepository,
    private readonly limitTypeRepository: LimitTypeRepository,
    private readonly userLimitRepository: UserLimitRepository,
    private readonly globalLimitRepository: GlobalLimitRepository,
    private readonly walletAccountCacheRepository: WalletAccountCacheRepository,
    private readonly operationStreamQuotationRepository: OperationStreamQuotationRepository,
    private readonly pendingWalletAccountTransactionRepository: PendingWalletAccountTransactionRepository,
    private readonly eventEmitter: OperationEventEmitter,
    private readonly operationSymbolCurrencyReal: string,
    private readonly pendingWalletAccountTransactionTTL: number,
    private readonly userLimitEventEmitter: UserLimitEventEmitter,
    private readonly userLimitTrackerRepository: UserLimitTrackerRepository,
  ) {
    this.logger = logger.child({ context: CreateOperationUseCase.name });
  }

  /**
   * Create an operation and update owner and or beneficiary balance. Also, it
   * can create a second operation in case of owner and beneficiary wallet account
   * have different currencies.
   *
   * Possible operation create scenarios:
   * - Owner only operation: create one operation for owner. Beneficiary info is
   *   not needed.
   * - Beneficiary only operation: create one operation for beneficiary. Owner
   *   info is not needed.
   * - Same currencies in wallet accounts: create one operation for both owner and
   *   beneficiary.
   * - Different currencies in wallet accounts: create two operations, one for
   *   the owner and another for the beneficiary.
   *
   * See Transaction Type participants to check if ownerInfo and beneficiaryInfo
   * are required.
   *
   * @param transactionTypeTag Transaction type TAG (see Transaction_types table).
   * @param ownerInfo Owner operation.
   * @param beneficiaryInfo Beneficiary operation.
   *
   * @returns Operations created.
   *   If ownerInfo is null then ownerOperation is also null.
   *   If beneficiaryInfo is null then beneficiaryOperation is also null.
   *
   * @throws {MissingDataException} If any parameter is missing.
   * @throws {InvalidDataFormatException} If any parameter has invalid format or type.
   * @throws {DataException} If there is a insconsistency in database.
   * @throws {TransactionTypeTagNotFoundException} If transaction tag was not found in database.
   * @throws {CurrencyNotFoundException} If currency was not found in database.
   * @throws {NotEnoughAvailableLimitException} If user does not have enough available limit.
   * @throws {NotEnoughFundsException} If user does not have enough funds.
   * @throws {NotEnoughLimitException} If operation value is over the limit allowed.
   * @throws {ValueUnderMinAmountLimitException} If value is under minimal value defined to this operation type.
   * @throws {ValueAboveMaxAmountLimitException} If value is above maximum value defined to this operation type.
   * @throws {WalletAccountNotFoundException} If onwer or beneficiary wallet account were not found.
   * @throws {TransactionTypeNotActiveException} If transaction type is not active.
   * @throws {OperationBetweenSameUserException} If user is trying to create a shared operation with himself.
   */
  async execute(
    transactionTypeTag: string,
    ownerInfo?: CreateOperationParticipant,
    beneficiaryInfo?: CreateOperationParticipant,
  ): Promise<CreatedOperation> {
    this.currentMoment = getMoment();

    this.logger.debug('Create operation.', {
      ownerInfo,
      beneficiaryInfo,
      transactionTypeTag,
      currentTime: this.currentMoment.toDate(),
    });

    // Data input check
    if (!ownerInfo && !beneficiaryInfo) {
      throw new MissingDataException(['Owner Info', 'Beneficiary Info']);
    }
    if (!transactionTypeTag) {
      throw new MissingDataException(['Transaction Type Tag']);
    }

    // Check input data.
    if (ownerInfo) {
      this.checkInputData(ownerInfo);
    }
    if (beneficiaryInfo) {
      this.checkInputData(beneficiaryInfo);
    }

    // Search transaction type.
    const transactionType =
      await this.transactionTypeRepository.getByTag(transactionTypeTag);

    if (!transactionType) {
      this.logger.debug('Transaction type not found.', { transactionTypeTag });
      throw new TransactionTypeTagNotFoundException(transactionTypeTag);
    }

    this.logger.debug('Transaction type.', { transactionType });

    // Sanity check
    if (!Object.values(TransactionTypeState).includes(transactionType.state)) {
      throw new DataException([
        `Transaction type state ${transactionType.state} is not supported.`,
      ]);
    }

    // Check if transaction type is active.
    if (!transactionType.isActive()) {
      throw new TransactionTypeNotActiveException(transactionType);
    }

    this.logger.debug('Check if all participants info are available.');

    // Check if all participants required are available.
    if (
      transactionType.isBothParticipantsRequired() &&
      (!ownerInfo || !beneficiaryInfo)
    ) {
      throw new MissingDataException([
        ...(!ownerInfo ? ['Owner Info'] : []),
        ...(!beneficiaryInfo ? ['Beneficiary Info'] : []),
      ]);
    } else if (transactionType.isOwnerParticipantsRequired() && !ownerInfo) {
      throw new MissingDataException(['Owner Info']);
    } else if (
      transactionType.isBeneficiaryParticipantsRequired() &&
      !beneficiaryInfo
    ) {
      throw new MissingDataException(['Beneficiary Info']);
    }

    let ownerWallet: Wallet = null;
    let ownerWalletAccount: WalletAccount = null;
    let beneficiaryWallet: Wallet = null;
    let beneficiaryWalletAccount: WalletAccount = null;

    try {
      // Load wallets.
      if (ownerInfo) {
        // Search owner currency.
        const currency = await this.currencyRepository.getByTag(
          ownerInfo.currency.tag,
        );

        if (!currency) {
          throw new CurrencyNotFoundException(ownerInfo.currency);
        }
        if (!currency.isActive()) {
          throw new CurrencyNotActiveException(ownerInfo.currency);
        }

        ownerWallet = await this.walletRepository.getByUuid(
          ownerInfo.wallet.uuid,
        );
        this.logger.debug('Owner Wallet.', { ownerWallet });

        if (!ownerWallet) {
          throw new WalletNotFoundException(ownerInfo.wallet);
        }
        if (!ownerWallet.isActive()) {
          throw new WalletNotActiveException(ownerWallet);
        }

        // Search owner wallet account.
        ownerWalletAccount =
          await this.walletAccountRepository.getByWalletAndCurrency(
            ownerWallet,
            currency,
          );
        this.logger.debug('Owner Wallet Account.', { ownerWalletAccount });

        if (!ownerWalletAccount) {
          throw new WalletAccountNotFoundException({
            wallet: ownerWallet,
            currency,
          });
        }
        if (!ownerWalletAccount.isActive()) {
          throw new WalletAccountNotActiveException(ownerWalletAccount);
        }

        this.pendingWalletAccountOwnerTransaction =
          new PendingWalletAccountTransactionEntity({
            operation: ownerInfo.operation,
            walletAccount: new WalletAccountEntity({
              id: ownerWalletAccount.id,
            }),
            value: Math.abs(ownerInfo.fee + ownerInfo.rawValue) * -1,
          });
        await this.pendingWalletAccountTransactionRepository.create(
          this.pendingWalletAccountOwnerTransaction,
        );
      }

      if (beneficiaryInfo) {
        // Search owner currency.
        const currency = await this.currencyRepository.getByTag(
          beneficiaryInfo.currency.tag,
        );

        if (!currency) {
          throw new CurrencyNotFoundException(beneficiaryInfo.currency);
        }
        if (!currency.isActive()) {
          throw new CurrencyNotActiveException(beneficiaryInfo.currency);
        }

        beneficiaryWallet = await this.walletRepository.getByUuid(
          beneficiaryInfo.wallet.uuid,
        );
        this.logger.debug('Beneficiary Wallet.', { beneficiaryWallet });

        if (!beneficiaryWallet) {
          throw new WalletNotFoundException(beneficiaryInfo.wallet);
        }
        if (!beneficiaryWallet.isActive()) {
          throw new WalletNotActiveException(beneficiaryWallet);
        }

        // Search beneficiary wallet account.
        beneficiaryWalletAccount =
          await this.walletAccountRepository.getByWalletAndCurrency(
            beneficiaryWallet,
            currency,
          );
        this.logger.debug('Beneficiary Wallet Account.', {
          beneficiaryWalletAccount,
        });

        if (!beneficiaryWalletAccount) {
          throw new WalletAccountNotFoundException({
            currency,
            wallet: beneficiaryWallet,
          });
        }
        if (!beneficiaryWalletAccount.isActive()) {
          throw new WalletAccountNotActiveException(beneficiaryWalletAccount);
        }

        this.pendingWalletAccountBeneficiaryTransaction =
          new PendingWalletAccountTransactionEntity({
            operation: beneficiaryInfo.operation,
            walletAccount: new WalletAccountEntity({
              id: beneficiaryWalletAccount.id,
            }),
            value: Math.abs(beneficiaryInfo.rawValue),
          });
        await this.pendingWalletAccountTransactionRepository.create(
          this.pendingWalletAccountBeneficiaryTransaction,
        );
      }

      // Should check owner capabilities?
      if (ownerWalletAccount) {
        //Check credit for user
        const creditBalanceAvailable = await this.getUserCreditBalance(
          transactionType,
          ownerWallet.user,
        );

        let ownerHasCreditBalanceAvailable = false;
        if (creditBalanceAvailable > 0) {
          ownerHasCreditBalanceAvailable = await this.checkCreditBalance(
            ownerWallet,
            creditBalanceAvailable,
          );
        }

        if (
          ownerInfo.ownerAllowAvailableRawValue &&
          ownerWalletAccount.balance < ownerInfo.rawValue + ownerInfo.fee
        ) {
          ownerInfo.ownerRequestedFee = ownerInfo.fee;
          ownerInfo.ownerRequestedRawValue = ownerInfo.rawValue;

          if (ownerWalletAccount.balance < ownerInfo.fee) {
            ownerInfo.rawValue = 0;
            ownerInfo.fee = ownerWalletAccount.balance;
          } else {
            ownerInfo.rawValue = ownerWalletAccount.balance - ownerInfo.fee;
          }
        }

        // Operation value is fee plus raw value
        const ownerValue = ownerInfo.fee + ownerInfo.rawValue;

        this.logger.debug('Operation owner value.', { ownerValue });

        // Does owner have enough balance?
        if (
          ownerWalletAccount.balance < ownerValue &&
          !ownerHasCreditBalanceAvailable
        ) {
          throw new NotEnoughFundsException(ownerWalletAccount, ownerValue);
        }

        // Test all precondition to create an debit operation.
        this.ownerUserLimitTracker = await this.checkUserLimits(
          ownerWallet.user,
          ownerWalletAccount,
          transactionType,
          ownerValue,
        );
      }

      // Should check beneficiary capabilities?
      if (beneficiaryWalletAccount) {
        // Operation value is fee plus raw value
        const beneficiaryValue = beneficiaryInfo.rawValue;

        this.logger.debug('Operation beneficiary value.', { beneficiaryValue });

        // Test all precondition to create an credit operation.
        this.beneficiaryUserLimitTracker = await this.checkUserLimits(
          beneficiaryWallet.user,
          beneficiaryWalletAccount,
          transactionType,
          beneficiaryValue,
        );
      }

      let ownerOperation: Operation = null;
      let beneficiaryOperation: Operation = null;

      // Should create two operations?
      if (
        ownerWalletAccount &&
        beneficiaryWalletAccount &&
        ownerWalletAccount.currency.id !== beneficiaryWalletAccount.currency.id
      ) {
        this.logger.debug('Create two independent operations.');

        // Create two operations.
        const {
          ownerOperation: createdOwnerOperation,
          beneficiaryOperation: createdBeneficiaryOperation,
        } = await this.createIndependentOperations({
          ownerInfo,
          ownerWallet,
          ownerWalletAccount,
          beneficiaryInfo,
          beneficiaryWallet,
          beneficiaryWalletAccount,
          transactionType,
        });

        ownerOperation = createdOwnerOperation;
        beneficiaryOperation = createdBeneficiaryOperation;
        // eslint-disable-next-line brace-style
      }
      // Should create one operation for both?
      else if (ownerWalletAccount && beneficiaryWalletAccount) {
        this.logger.debug('Create shared operation for both.');

        // Create both operation
        const createdOperation = await this.createSharedOperation({
          ownerInfo,
          ownerWallet,
          ownerWalletAccount,
          beneficiaryWallet,
          beneficiaryWalletAccount,
          transactionType,
        });

        ownerOperation = createdOperation;
        beneficiaryOperation = createdOperation;
        // eslint-disable-next-line brace-style
      }
      // Should create owner's operation only?
      else if (ownerWalletAccount) {
        this.logger.debug('Create owner operation.');

        // Create owner's operation
        const createdOperation = await this.createOwnerOperation({
          ownerInfo,
          ownerWallet,
          ownerWalletAccount,
          transactionType,
        });

        ownerOperation = createdOperation;
        // eslint-disable-next-line brace-style
      }
      // Should create beneficiary's operation only?
      else {
        this.logger.debug('Create beneficiary operation.');

        // Create beneficiary's operation
        const createdOperation = await this.createBeneficiaryOperation({
          beneficiaryInfo,
          beneficiaryWallet,
          beneficiaryWalletAccount,
          transactionType,
        });

        beneficiaryOperation = createdOperation;
      }

      this.logger.debug('Created owner operation.', { ownerOperation });
      this.logger.debug('Created beneficiary operation.', {
        beneficiaryOperation,
      });

      // Event emitter
      this.eventEmitter.pendingOperation({
        ownerOperation,
        beneficiaryOperation,
      });

      return { ownerOperation, beneficiaryOperation };
    } catch (error) {
      await this.removePendingWalletAccountTransaction();

      throw error;
    }
  }

  /**
   * Create an operation for beneficiary.
   *
   * @param param.beneficiaryInfo Beneficiary info (operation value, state, etc).
   * @param param.beneficiaryWallet Beneficiary wallet.
   * @param param.beneficiaryWalletAccount Beneficiary's wallet account.
   * @param param.transactionType Operation's transaction type.
   * @returns Created operation.
   */
  private async createBeneficiaryOperation({
    beneficiaryInfo,
    beneficiaryWallet,
    beneficiaryWalletAccount,
    transactionType,
  }: OperationInfo): Promise<Operation> {
    return this.createOperation({
      beneficiaryInfo,
      beneficiaryWallet,
      beneficiaryWalletAccount,
      transactionType,
    });
  }

  /**
   * Create an operation for owner.
   *
   * @param param.ownerInfo Owner info (operation value, state, etc).
   * @param param.ownerWallet Owner wallet.
   * @param param.ownerWalletAccount Owner's wallet account.
   * @param param.transactionType Operation's transaction type.
   * @returns Created operation.
   */
  private async createOwnerOperation({
    ownerInfo,
    ownerWallet,
    ownerWalletAccount,
    transactionType,
  }: OperationInfo): Promise<Operation> {
    return this.createOperation({
      ownerInfo,
      ownerWallet,
      ownerWalletAccount,
      transactionType,
    });
  }

  /**
   * Create two operations, one to owner and another to beneficiary.
   *
   * @param param.ownerInfo Owner info (operation value, state, etc).
   * @param param.ownerWallet Owner wallet.
   * @param param.ownerWalletAccount Owner's wallet account.
   * @param param.beneficiaryInfo Beneficiary info (operation value, state, etc).
   * @param param.beneficiaryWallet Beneficiary wallet.
   * @param param.beneficiaryWalletAccount Beneficiary's wallet account.
   * @param param.transactionType Operation's transaction type.
   * @returns Created operations {ownerOperation, beneficiaryOperation}.
   */
  private async createIndependentOperations({
    ownerInfo,
    ownerWallet,
    ownerWalletAccount,
    beneficiaryInfo,
    beneficiaryWallet,
    beneficiaryWalletAccount,
    transactionType,
  }: OperationInfo): Promise<CreatedOperation> {
    // Create owner operation
    const ownerOperation = await this.createOperation({
      ownerInfo,
      ownerWallet,
      ownerWalletAccount,
      transactionType,
    });

    // Create beneficiary operation.
    const beneficiaryOperation = await this.createOperation({
      beneficiaryInfo,
      beneficiaryWallet,
      beneficiaryWalletAccount,
      transactionType,
    });

    // Associate both operations
    ownerOperation.operationRef = beneficiaryOperation;
    beneficiaryOperation.operationRef = ownerOperation;

    // Store association
    await this.operationRepository.update(ownerOperation);
    await this.operationRepository.update(beneficiaryOperation);

    return { ownerOperation, beneficiaryOperation };
  }

  /**
   * Create an unique operation for both owner and beneficiary users.
   *
   * @param param.ownerInfo Owner info (operation value, state, etc).
   * @param param.ownerWallet Owner wallet.
   * @param param.ownerWalletAccount Owner's wallet account.
   * @param param.beneficiaryWallet Beneficiary wallet.
   * @param param.beneficiaryWalletAccount Beneficiary's wallet account.
   * @param param.transactionType Operation's transaction type.
   * @returns Created operation.
   */
  private async createSharedOperation({
    ownerInfo,
    ownerWallet,
    ownerWalletAccount,
    beneficiaryWallet,
    beneficiaryWalletAccount,
    transactionType,
  }: OperationInfo): Promise<Operation> {
    return this.createOperation({
      ownerInfo,
      ownerWallet,
      ownerWalletAccount,
      beneficiaryWallet,
      beneficiaryWalletAccount,
      transactionType,
    });
  }

  /**
   * Create an operation to the desired transaction type.
   *
   * @param param.ownerInfo Owner info (operation value, state, etc).
   * @param param.owner Owner user.
   * @param param.ownerWalletAccount Owner's wallet account.
   * @param param.beneficiaryInfo Beneficiary info (operation value, state, etc).
   * @param param.beneficiary Beneficiary user.
   * @param param.beneficiaryWalletAccount Beneficiary's wallet account.
   * @param param.transactionType Operation's transaction type.
   * @returns Created operation.
   */
  private async createOperation({
    ownerInfo = null,
    ownerWallet = null,
    ownerWalletAccount = null,
    beneficiaryInfo = null,
    beneficiaryWallet = null,
    beneficiaryWalletAccount = null,
    transactionType,
  }: OperationInfo): Promise<Operation> {
    // Beneficiary fee should debit from final value.
    const fee = ownerInfo ? ownerInfo.fee : -beneficiaryInfo.fee;
    // Raw value is the original transaction value.
    const rawValue = ownerInfo ? ownerInfo.rawValue : beneficiaryInfo.rawValue;
    const description = ownerInfo
      ? ownerInfo.description
      : beneficiaryInfo.description;
    const currency = ownerInfo
      ? ownerWalletAccount.currency
      : beneficiaryWalletAccount.currency;

    // Operation value is fee plus raw value
    const value = fee + rawValue;

    // Create operation.
    let operation = new OperationEntity({
      id: ownerInfo?.operation?.id ?? beneficiaryInfo?.operation?.id,
      state: OperationState.PENDING,
      owner: ownerWallet?.user ?? null,
      ownerWalletAccount,
      beneficiary: beneficiaryWallet?.user ?? null,
      beneficiaryWalletAccount,
      transactionType,
      currency,
      rawValue,
      fee: Math.abs(fee), // Store fee as positive value
      value,
      description,
      ownerRequestedRawValue: ownerInfo?.ownerRequestedRawValue,
      ownerRequestedFee: ownerInfo?.ownerRequestedFee,
      analysisTags: [],
    });

    if (ownerInfo && this.ownerUserLimitTracker) {
      const { updatedUserLimitTracker, updatedOperation } =
        await this.updateUserLimitTrackerAndOperation(
          this.ownerUserLimitTracker,
          operation,
        );

      await this.userLimitTrackerRepository.createOrUpdate(
        updatedUserLimitTracker,
      );

      this.logger.debug('User limit tracker created or updated.', {
        userLimitTracker: updatedUserLimitTracker,
      });

      operation = updatedOperation;
    }

    if (beneficiaryInfo && this.beneficiaryUserLimitTracker) {
      const { updatedUserLimitTracker, updatedOperation } =
        await this.updateUserLimitTrackerAndOperation(
          this.beneficiaryUserLimitTracker,
          operation,
        );

      await this.userLimitTrackerRepository.createOrUpdate(
        updatedUserLimitTracker,
      );

      this.logger.debug('User limit tracker created or updated.', {
        userLimitTracker: updatedUserLimitTracker,
      });

      operation = updatedOperation;
    }

    // Store operation
    const createdOperation = await this.operationRepository.create(operation);

    await this.removePendingWalletAccountTransaction();

    // Should block owner balance?
    if (ownerWalletAccount) {
      await this.blockWalletAccountBalance(ownerWalletAccount, value);
    }

    this.logger.debug('Operation created.', {
      operation: createdOperation,
    });

    return createdOperation;
  }

  /**
   * Block wallet account balance.
   *
   * @param param.walletAccount Related wallet account.
   * @param param.value Block value
   */
  private async blockWalletAccountBalance(
    walletAccount: WalletAccount,
    value: number,
  ) {
    // Update balance and pending amount
    walletAccount.balance = walletAccount.balance - value;
    walletAccount.pendingAmount = walletAccount.pendingAmount + value;

    // Store update balance
    await this.walletAccountRepository.update(walletAccount);

    this.logger.debug('Updated wallet account.', { walletAccount });
  }

  /**
   * Check operation input data info.
   * @throws {MissingDataException} If any mandatory field is missing.
   * @throws {InvalidDataFormatException} If any field format is invalid.
   */
  private checkInputData(operationParticipant: CreateOperationParticipant) {
    const { operation, currency, rawValue, fee, description, wallet } =
      operationParticipant;

    if (
      !operation?.id ||
      !wallet?.uuid ||
      !currency?.tag ||
      !description ||
      !rawValue ||
      !isDefined(fee)
    ) {
      throw new MissingDataException([
        ...(!operation?.id ? ['Operation'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!currency?.tag ? ['Currency'] : []),
        ...(!description ? ['Description'] : []),
        ...(!rawValue ? ['rawValue'] : []),
        ...(!isDefined(fee) ? ['fee'] : []),
      ]);
    }

    if (rawValue <= 0) {
      throw new InvalidDataFormatException(['rawValue']);
    }

    if (fee < 0) {
      throw new InvalidDataFormatException(['Fee']);
    }
  }

  /**
   * Check if the user has all preconditions to execute the operation.
   *
   * @param user User where limits will be checked.
   * @param walletAccount User's wallet account.
   * @param transactionType Desired transaction type.
   * @param value Operation value.
   * @returns User limit tracker.
   * @throws {NotEnoughFundsException} Wallet account has not enough funds.
   * @throws {NotEnoughLimitException} Operation value is beyond the user's limits.
   * @throws {ValueAboveMaxAmountLimitException} Operation value is above max amount allowed.
   * @throws {ValueUnderMinAmountLimitException} Operation value is under min amount allowed.
   * @throws {NotEnoughAvailableLimitException} Operation value is beyond the user's limits available.
   */
  private async checkUserLimits(
    user: User,
    walletAccount: WalletAccount,
    transactionType: TransactionType,
    value: number,
  ): Promise<UserLimitTracker> {
    this.logger.debug('Owner has enough balance.');

    // Get limit type from transaction type.
    const limitType =
      transactionType.limitType &&
      (await this.limitTypeRepository.getById(transactionType.limitType.id));

    this.logger.debug('Limit type.', { limitType });

    // Should check limit for this transaction?
    if (limitType && limitType.currency?.id === walletAccount.currency.id) {
      // Search or create user limit and user limit tracker.
      const { userLimit, userLimitTracker, checkUsedLimitFlag } =
        await this.getLimit(user, limitType);

      this.logger.debug('User limit and user limit tracker.', {
        userLimit,
        userLimitTracker,
      });

      // Check limits compliance limits
      if (
        userLimit.dailyLimit < value ||
        userLimit.monthlyLimit < value ||
        userLimit.yearlyLimit < value
      ) {
        throw new NotEnoughLimitException(userLimit, value);
      }

      // Check user defined limits
      if (
        (userLimit.userDailyLimit && userLimit.userDailyLimit < value) ||
        (userLimit.userMonthlyLimit && userLimit.userMonthlyLimit < value) ||
        (userLimit.userYearlyLimit && userLimit.userYearlyLimit < value)
      ) {
        throw new NotEnoughLimitException(userLimit, value);
      }

      // Check night limits
      if (userLimit.isInNighttimeInterval(this.currentMoment)) {
        // Check compliance night limit
        if (userLimit.nightlyLimit && userLimit.nightlyLimit < value) {
          throw new NotEnoughLimitException(userLimit, value);
        }

        // Check user defined night limit
        if (userLimit.userNightlyLimit && userLimit.userNightlyLimit < value) {
          throw new NotEnoughLimitException(userLimit, value);
        }

        // Check if value is above compliance max amount nightly allowed.
        if (userLimit.maxAmountNightly && userLimit.maxAmountNightly < value) {
          throw new ValueAboveMaxAmountNightlyLimitException(userLimit, value);
        }

        // Check if value is above user defined max amount nightly allowed.
        if (
          userLimit.userMaxAmountNightly &&
          userLimit.userMaxAmountNightly < value
        ) {
          throw new ValueAboveMaxAmountNightlyLimitException(userLimit, value);
        }

        // Check if value is under compliance min amount nightly allowed.
        if (userLimit.minAmountNightly && value < userLimit.minAmountNightly) {
          throw new ValueUnderMinAmountNightlyLimitException(userLimit, value);
        }

        // Check if value is under user defined min amount nightly allowed.
        if (
          userLimit.userMinAmountNightly &&
          value < userLimit.userMinAmountNightly
        ) {
          throw new ValueUnderMinAmountNightlyLimitException(userLimit, value);
        }
      }

      // Check if value is above compliance max amount allowed.
      if (userLimit.maxAmount && userLimit.maxAmount < value) {
        throw new ValueAboveMaxAmountLimitException(userLimit, value);
      }

      // Check if value is above user defined max amount allowed.
      if (userLimit.userMaxAmount && userLimit.userMaxAmount < value) {
        throw new ValueAboveMaxAmountLimitException(userLimit, value);
      }

      // Check if value is under compliance min amount allowed.
      if (userLimit.minAmount && value < userLimit.minAmount) {
        throw new ValueUnderMinAmountLimitException(userLimit, value);
      }

      // Check if value is under user defined min amount allowed.
      if (userLimit.userMinAmount && value < userLimit.userMinAmount) {
        throw new ValueUnderMinAmountLimitException(userLimit, value);
      }

      // Define used limit.
      const usedUserLimit: UsedLimit = checkUsedLimitFlag
        ? await this.getUsedLimit(walletAccount, userLimit, limitType)
        : {
            nightlyLimit: userLimitTracker.usedNightlyLimit,
            dailyLimit: userLimitTracker.usedDailyLimit,
            monthlyLimit: userLimitTracker.usedMonthlyLimit,
            yearlyLimit: userLimitTracker.usedAnnualLimit,
          };

      this.logger.debug('User limit used.', { usedUserLimit });

      // Check used compliance limits
      if (
        userLimit.dailyLimit - usedUserLimit.dailyLimit < value ||
        userLimit.monthlyLimit - usedUserLimit.monthlyLimit < value ||
        userLimit.yearlyLimit - usedUserLimit.yearlyLimit < value
      ) {
        throw new NotEnoughAvailableLimitException(usedUserLimit, value);
      }

      // Check used user defined limits
      if (
        (userLimit.userDailyLimit &&
          userLimit.userDailyLimit - usedUserLimit.dailyLimit < value) ||
        (userLimit.userMonthlyLimit &&
          userLimit.userMonthlyLimit - usedUserLimit.monthlyLimit < value) ||
        (userLimit.userYearlyLimit &&
          userLimit.userYearlyLimit - usedUserLimit.yearlyLimit < value)
      ) {
        throw new NotEnoughAvailableLimitException(usedUserLimit, value);
      }

      // Should check night limits?
      if (userLimit.isInNighttimeInterval(this.currentMoment)) {
        // Check used compliance night limit
        if (
          userLimit.nightlyLimit &&
          userLimit.nightlyLimit - usedUserLimit.nightlyLimit < value
        ) {
          throw new NotEnoughAvailableLimitException(usedUserLimit, value);
        }

        // Check used user defined night limit
        if (
          userLimit.userNightlyLimit &&
          userLimit.userNightlyLimit - usedUserLimit.nightlyLimit < value
        ) {
          throw new NotEnoughAvailableLimitException(usedUserLimit, value);
        }
      }

      return userLimitTracker;
    }
  }

  /**
   * Get or create a user limit and user limit tracker.
   *
   * @param user Limit owner.
   * @param limitType Limit
   * @returns User limit, user limit tracker found or new ones and the checkUsedLimitFlag, which indicates where to calculate the used limits by the method or not.
   * @throws Limit has not default values.
   */
  private async getLimit(
    user: User,
    limitType: LimitType,
  ): Promise<{
    userLimit: UserLimit;
    userLimitTracker: UserLimitTracker;
    checkUsedLimitFlag: boolean;
  }> {
    // If true, check used limit independently of the created user limit tracker.
    let checkUsedLimitFlag = false;

    // Get user limit.
    let userLimit = await this.userLimitRepository.getByUserAndLimitType(
      user,
      limitType,
    );

    this.logger.debug('User Limit found.', {
      userLimit,
    });

    // Get user limit tracker.
    let userLimitTracker =
      userLimit &&
      (await this.userLimitTrackerRepository.getByUserLimit(userLimit));

    this.logger.debug('User Limit Tracker found.', {
      userLimitTracker,
    });

    // If user has already user limit and user limit tracker, return them.
    if (userLimit && userLimitTracker) {
      userLimitTracker.userLimit = userLimit;

      // Restart user limit tracker if necessary.
      userLimitTracker = await this.restartUserLimitTracker(userLimitTracker);

      return { userLimit, userLimitTracker, checkUsedLimitFlag };
    }

    // If no user limit is found, create a new one.
    if (!userLimit) {
      // Get default limits
      const globalLimit =
        await this.globalLimitRepository.getByLimitType(limitType);

      // Sanity check.
      if (!globalLimit) {
        throw new DataException(['Missing global limit for ' + limitType.tag]);
      }

      const {
        nightlyLimit,
        dailyLimit,
        monthlyLimit,
        yearlyLimit,
        maxAmount,
        minAmount,
        maxAmountNightly,
        minAmountNightly,
        userMaxAmount,
        userMinAmount,
        userMaxAmountNightly,
        userMinAmountNightly,
        userNightlyLimit,
        userDailyLimit,
        userMonthlyLimit,
        userYearlyLimit,
        nighttimeStart,
        nighttimeEnd,
      } = globalLimit;

      //Create a default limit.
      userLimit = new UserLimitEntity({
        id: uuidV4(),
        user,
        limitType,
        nightlyLimit,
        dailyLimit,
        monthlyLimit,
        yearlyLimit,
        maxAmount,
        minAmount,
        maxAmountNightly,
        minAmountNightly,
        userMaxAmount,
        userMinAmount,
        userMaxAmountNightly,
        userMinAmountNightly,
        userNightlyLimit,
        userDailyLimit,
        userMonthlyLimit,
        userYearlyLimit,
        nighttimeStart,
        nighttimeEnd,
      });

      await this.userLimitRepository.create(userLimit);

      this.logger.debug('User Limit created.', {
        userLimit,
      });

      this.userLimitEventEmitter.createdUserLimit(userLimit);
    }

    // If no user limit tracker is found, create a new one.
    if (!userLimitTracker) {
      userLimitTracker = new UserLimitTrackerEntity({
        id: uuidV4(),
        userLimit,
        periodStart: limitType.periodStart,
        usedDailyLimit: 0,
        usedMonthlyLimit: 0,
        usedAnnualLimit: 0,
        usedNightlyLimit: 0,
      });

      this.logger.debug('User Limit Tracker started being created.', {
        userLimitTracker,
      });

      checkUsedLimitFlag = true;
    }

    return { userLimit, userLimitTracker, checkUsedLimitFlag };
  }

  private async getUserCreditBalance(
    transactionType: TransactionType,
    user: User,
  ): Promise<number> {
    // Get limit type from transaction type.
    const limitTypeFound =
      await this.limitTypeRepository.getByTransactionType(transactionType);

    this.logger.debug('LimitType found.', limitTypeFound);

    if (limitTypeFound) {
      const checkUserLimit =
        await this.userLimitRepository.getByUserAndLimitType(
          user,
          limitTypeFound,
        );

      return checkUserLimit?.creditBalance || 0;
    }

    return 0;
  }

  private async checkCreditBalance(
    ownerWallet: Wallet,
    creditBalanceAvailable: number,
  ): Promise<boolean> {
    let liability = 0;
    const quoteCurrency = new CurrencyEntity({
      symbol: this.operationSymbolCurrencyReal,
    });

    const walletAccounts = await this.walletAccountCacheRepository.getAllByUser(
      ownerWallet.user,
    );

    this.logger.debug('WalletAccountCaches found.', { walletAccounts });

    if (!walletAccounts.length) {
      throw new WalletAccountNotFoundException({ wallet: ownerWallet });
    }

    for (const walletAccount of walletAccounts) {
      // Run all cachedTransaction and debit or credit balance
      const pendingWalletAccountTransactions =
        await this.pendingWalletAccountTransactionRepository.getByWalletAccount(
          walletAccount,
        );

      pendingWalletAccountTransactions.map(
        (el) => (walletAccount.balance += el.value),
      );

      // Calculate liability (just negative balances) (After credit or debit pendingTransactions)
      if (walletAccount.balance < 0) {
        // Calculate using balance BRL, not need to get quotation
        if (
          walletAccount.currency?.symbol === this.operationSymbolCurrencyReal
        ) {
          liability += Math.abs(walletAccount.balance);
          continue;
        }

        const baseCurrency = walletAccount.currency;

        const streamQuotationsFound =
          await this.operationStreamQuotationRepository.getByBaseCurrencyAndQuoteCurrency(
            baseCurrency,
            quoteCurrency,
          );

        this.logger.debug('StreamQuotations found.', { streamQuotationsFound });

        if (!streamQuotationsFound.length) {
          throw new StreamQuotationNotFoundException({
            baseCurrency,
            quoteCurrency,
          });
        }

        // Sort quotations by priority
        const [streamQuotationFound] = streamQuotationsFound.sort(
          (a, b) => a.priority - b.priority,
        );

        const formattedBalance = formatValueFromIntToFloat(
          Math.abs(walletAccount.balance),
          baseCurrency.decimal,
        );

        // value in BRL for walletAccountBalance used to calculate liability
        const priceAmount = streamQuotationFound.price * formattedBalance;

        const formattedPriceAmount = formatValueFromFloatToInt(priceAmount);

        liability += formattedPriceAmount;

        this.logger.debug('Reference values for calculate liability.', {
          liability,
          baseCurrency,
          priceAmount,
        });
      }
    }

    // Check if all negative values in account is greather or equal than credit balance enabled
    if (liability > creditBalanceAvailable) {
      return false;
    }

    return true;
  }

  private async removePendingWalletAccountTransaction() {
    // Update pending wallet account ttl in cache
    if (
      this.pendingWalletAccountOwnerTransaction &&
      !this.pendingWalletAccountOwnerTransaction.ttl
    ) {
      this.pendingWalletAccountOwnerTransaction.ttl =
        this.pendingWalletAccountTransactionTTL;
      await this.pendingWalletAccountTransactionRepository.update(
        this.pendingWalletAccountOwnerTransaction,
      );
    }

    if (
      this.pendingWalletAccountBeneficiaryTransaction &&
      !this.pendingWalletAccountBeneficiaryTransaction.ttl
    ) {
      this.pendingWalletAccountBeneficiaryTransaction.ttl =
        this.pendingWalletAccountTransactionTTL;
      await this.pendingWalletAccountTransactionRepository.update(
        this.pendingWalletAccountBeneficiaryTransaction,
      );
    }
  }

  /**
   * Restarts user limit tracker based on its period start and last updated at.
   *
   * @param userLimitTracker User limit tracker to be restarted.
   * @returns User limit tracker restarted.
   */
  private async restartUserLimitTracker(
    userLimitTracker: UserLimitTracker,
  ): Promise<UserLimitTracker> {
    // Restart user limit tracker for DATE period start limit types if necessary.
    if (
      userLimitTracker.periodStart === LimitTypePeriodStart.DATE &&
      (userLimitTracker.usedDailyLimit > 0 ||
        userLimitTracker.usedMonthlyLimit > 0 ||
        userLimitTracker.usedAnnualLimit > 0)
    ) {
      userLimitTracker =
        await this.restartUserLimitTrackerByDatePeriodStart(userLimitTracker);
    }

    // Restart nightly used limit for BOTH DATE and INTERVAL period start limit types if necessary.
    if (userLimitTracker.usedNightlyLimit > 0) {
      userLimitTracker =
        await this.restartNightlyUserLimitTracker(userLimitTracker);
    }

    this.logger.debug('User limit tracker restarted.', {
      userLimitTracker,
    });

    return userLimitTracker;
  }

  /**
   * Restarts user limit tracker nightly limit.
   *
   * @param userLimitTracker User limit tracker to be restarted.
   * @returns User limit tracker restarted.
   */
  private async restartNightlyUserLimitTracker(
    userLimitTracker: UserLimitTracker,
  ): Promise<UserLimitTracker> {
    this.logger.debug('Restart nightly user limit', {
      userLimitTracker,
    });

    if (!userLimitTracker.userLimit.isInNighttimeInterval(this.currentMoment)) {
      userLimitTracker.usedNightlyLimit = 0;
    }

    return userLimitTracker;
  }

  /**
   * Restarts user limit tracker DATE period start.
   *
   * @param userLimitTracker User limit tracker to be restarted.
   * @returns User limit tracker restarted.
   */
  private async restartUserLimitTrackerByDatePeriodStart(
    userLimitTracker: UserLimitTracker,
  ): Promise<UserLimitTracker> {
    // FIXME: Revisar se aqui usa ou não UTC
    const today = getMoment();
    const updatedAt = getMoment(userLimitTracker.updatedAt);

    const todayDay = today.startOf('day');
    const updatedAtDay = updatedAt.startOf('day');

    // If day has changed, restart usedDailyLimit.
    if (userLimitTracker.usedDailyLimit > 0 && !todayDay.isSame(updatedAtDay)) {
      userLimitTracker.usedDailyLimit = 0;
    }

    const todayMonth = today.startOf('month');
    const updatedAtMonth = updatedAt.startOf('month');

    // If month has changed, restart usedMonthlyLimit.
    if (
      userLimitTracker.usedMonthlyLimit > 0 &&
      !todayMonth.isSame(updatedAtMonth)
    ) {
      userLimitTracker.usedMonthlyLimit = 0;
    }

    const todayYear = today.startOf('year');
    const updatedAtYear = updatedAt.startOf('year');

    // If year has changed, restart usedAnnualLimit.
    if (
      userLimitTracker.usedAnnualLimit > 0 &&
      !todayYear.isSame(updatedAtYear)
    ) {
      userLimitTracker.usedAnnualLimit = 0;
    }

    return userLimitTracker;
  }

  /**
   * Updates user limit tracker and operation.
   *
   * @param userLimitTracker User limit tracker to be created or updated.
   * @param operation Operation to be updated.
   */
  private async updateUserLimitTrackerAndOperation(
    userLimitTracker: UserLimitTracker,
    operation: Operation,
  ): Promise<{
    updatedUserLimitTracker: UserLimitTracker;
    updatedOperation: Operation;
  }> {
    const tags = [];

    this.logger.debug('Update user limit tracker and operation', {
      userLimitTracker,
      operation,
    });

    userLimitTracker.usedDailyLimit += operation.value;
    userLimitTracker.usedMonthlyLimit += operation.value;
    userLimitTracker.usedAnnualLimit += operation.value;

    // Update nightly used limit if needed.
    if (userLimitTracker.userLimit.isInNighttimeInterval(this.currentMoment)) {
      userLimitTracker.usedNightlyLimit += operation.value;
    }

    if (userLimitTracker.periodStart === LimitTypePeriodStart.DATE) {
      tags.push(OperationAnalysisTag.DATE_LIMIT_INCLUDED);
    }

    if (userLimitTracker.periodStart === LimitTypePeriodStart.INTERVAL) {
      tags.push(
        OperationAnalysisTag.DAILY_INTERVAL_LIMIT_INCLUDED,
        OperationAnalysisTag.MONTHLY_INTERVAL_LIMIT_INCLUDED,
        OperationAnalysisTag.ANNUAL_INTERVAL_LIMIT_INCLUDED,
      );
    }

    // Insert tags into operation.
    operation.analysisTags = tags;
    operation.userLimitTracker = userLimitTracker;

    // Update Operation.
    return {
      updatedUserLimitTracker: userLimitTracker,
      updatedOperation: operation,
    };
  }

  /**
   * Searches in operations to measure how much of the limit user has used.
   *
   * @param walletAccount User's wallet account.
   * @param userLimit Operation limit type.
   * @param limitType Limit type.
   * @returns User's used limit.
   */
  private async getUsedLimit(
    walletAccount: WalletAccount,
    userLimit: UserLimit,
    limitType: LimitType,
  ): Promise<UsedLimit> {
    // Use start date as default period
    let startDay = getMoment().startOf('day');
    let startMonth = getMoment().startOf('month');
    let startYear: any = getMoment().startOf('year');

    // Should use interval as period start?
    if (limitType.periodStart === LimitTypePeriodStart.INTERVAL) {
      startDay = getMoment().subtract(1, 'day');
      startMonth = getMoment().subtract(1, 'month');
      startYear = getMoment().subtract(1, 'year');
    }

    startYear = startYear.format('YYYY-MM-DD');

    const yearOperations = [];

    // Get owner operations
    if ([LimitTypeCheck.BOTH, LimitTypeCheck.OWNER].includes(limitType.check)) {
      const previousOperations =
        await this.operationRepository.getValueAndCreatedAtByOwnerWalletAccountAndCreatedAtAfterAndTransactionTypeAndStateIn(
          walletAccount,
          startYear,
          limitType.transactionTypes,
          getOperationLimitCheckStates(),
        );
      yearOperations.push(...previousOperations);
    }

    // Get beneficiary operations
    if (
      [LimitTypeCheck.BOTH, LimitTypeCheck.BENEFICIARY].includes(
        limitType.check,
      )
    ) {
      const previousOperations =
        await this.operationRepository.getValueAndCreatedAtByBeneficiaryWalletAccountAndCreatedAtAfterAndTransactionTypeAndStateIn(
          walletAccount,
          startYear,
          limitType.transactionTypes,
          getOperationLimitCheckStates(),
        );
      yearOperations.push(...previousOperations);
    }

    // Get used limits
    const usedLimits = yearOperations.reduce(
      (sum, operation) => {
        if (userLimit.isInNighttimeInterval(operation.createdAt)) {
          sum.nightlyLimit += operation.value;
        }
        if (startDay.isBefore(operation.createdAt)) {
          sum.dailyLimit += operation.value;
        }
        if (startMonth.isBefore(operation.createdAt)) {
          sum.monthlyLimit += operation.value;
        }
        sum.yearlyLimit += operation.value;

        return sum;
      },
      { nightlyLimit: 0, dailyLimit: 0, monthlyLimit: 0, yearlyLimit: 0 },
    );

    return usedLimits;
  }
}
