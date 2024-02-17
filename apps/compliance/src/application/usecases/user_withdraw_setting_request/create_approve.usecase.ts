import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequest,
  WithdrawSettingType,
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import { User } from '@zro/users/domain';
import { TransactionType, Wallet } from '@zro/operations/domain';
import {
  DecodedPixKey,
  DecodedPixKeyEntity,
  PixKey,
} from '@zro/pix-keys/domain';
import {
  TransactionTypeNotFoundException,
  UserWalletNotFoundException,
} from '@zro/operations/application';
import {
  OperationService,
  PixKeyService,
  UserWithdrawSettingRequestDocumentWrongException,
  UserWithdrawSettingRequestEventEmitter,
  UtilService,
  UserWithdrawSettingAlreadyExistsException,
} from '@zro/compliance/application';

export class CreateApproveUserWithdrawSettingRequestUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRequestRepository user withdraw setting request repository.
   * @param operationService operation service.
   * @param eventEmitter user withdraw setting request event emitter.
   * @param utilService Util service.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    private readonly operationService: OperationService,
    private readonly pixKeyService: PixKeyService,
    private readonly eventEmitter: UserWithdrawSettingRequestEventEmitter,
    private readonly utilService: UtilService,
  ) {
    this.logger = logger.child({
      context: CreateApproveUserWithdrawSettingRequestUseCase.name,
    });
  }

  /**
   * Create new user withdraw setting request.
   */
  async execute(
    id: UserWithdrawSettingRequest['id'],
    type: UserWithdrawSettingRequest['type'],
    balance: UserWithdrawSettingRequest['balance'],
    day: UserWithdrawSettingRequest['day'],
    weekDay: UserWithdrawSettingRequest['weekDay'],
    wallet: Wallet,
    user: User,
    transactionType: TransactionType,
    pixKey: PixKey,
  ): Promise<UserWithdrawSettingRequest> {
    this.checkInput(
      id,
      type,
      balance,
      day,
      weekDay,
      wallet,
      user,
      transactionType,
      pixKey,
    );

    const userWithdrawSettingRequestFound = await this.getById(id);

    if (userWithdrawSettingRequestFound) {
      return userWithdrawSettingRequestFound;
    }

    await this.checkUserWallet(user, wallet);

    const transactionTypeFound =
      await this.checkTransactionType(transactionType);

    if (pixKey.document) {
      return this.checkDocumentAndCreate(
        id,
        type,
        balance,
        day,
        weekDay,
        wallet,
        user,
        transactionTypeFound,
        pixKey,
      );
    }

    return this.create(
      id,
      type,
      balance,
      day,
      weekDay,
      wallet,
      user,
      transactionTypeFound,
      pixKey,
    );
  }

  private checkInput(
    id: UserWithdrawSettingRequest['id'],
    type: UserWithdrawSettingRequest['type'],
    balance: UserWithdrawSettingRequest['balance'],
    day: UserWithdrawSettingRequest['day'],
    weekDay: UserWithdrawSettingRequest['weekDay'],
    wallet: Wallet,
    user: User,
    transactionType: TransactionType,
    pixKey: PixKey,
  ) {
    if (
      !id ||
      !type ||
      !balance ||
      !wallet?.uuid ||
      !user?.uuid ||
      !transactionType?.tag ||
      !pixKey?.type ||
      !pixKey.key
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!type ? ['Type'] : []),
        ...(!balance ? ['Balance'] : []),
        ...(!wallet?.uuid ? ['Wallet UUID'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
        ...(!transactionType?.tag ? ['TransactionType Tag'] : []),
        ...(!pixKey?.type ? ['Pix Key Type'] : []),
        ...(!pixKey?.key ? ['Pix Key'] : []),
      ]);
    }

    if (type === WithdrawSettingType.WEEKLY && !weekDay) {
      throw new MissingDataException(['Week Day']);
    }

    if (type === WithdrawSettingType.MONTHLY && !day) {
      throw new MissingDataException(['Day']);
    }
  }

  private async getById(id: string): Promise<UserWithdrawSettingRequest> {
    const userWithdrawSettingRequestFound =
      await this.userWithdrawSettingRequestRepository.getById(id);

    this.logger.debug('User withdraw setting request if same id.', {
      userWithdrawSettingRequestFound,
    });

    return userWithdrawSettingRequestFound;
  }

  private async checkUserWallet(user: User, wallet: Wallet) {
    const userWalletFound =
      await this.operationService.getUserWalletByUserAndWallet(user, wallet);

    this.logger.debug('User Wallet found.', { userWalletFound });

    if (!userWalletFound) {
      throw new UserWalletNotFoundException({ user, wallet });
    }

    const userWithdrawSettingWallet =
      await this.utilService.getAllByWalletUserWithdrawSetting(wallet);

    this.logger.debug('User withdraw setting by wallet user found.', {
      userWithdrawSettingWallet,
    });

    if (userWithdrawSettingWallet.length) {
      throw new UserWithdrawSettingAlreadyExistsException({ user, wallet });
    }
  }

  private async checkTransactionType(
    transactionType: TransactionType,
  ): Promise<TransactionType> {
    const transactionTypeFound =
      await this.operationService.getTransactionTypeByTag(transactionType.tag);

    if (!transactionTypeFound) {
      throw new TransactionTypeNotFoundException({ tag: transactionType.tag });
    }

    this.logger.debug('Transaction type found.', { transactionTypeFound });

    return transactionTypeFound;
  }

  private async save(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSettingRequest> {
    const userWithdrawSettingsRequestCreated =
      await this.userWithdrawSettingRequestRepository.create(
        userWithdrawSettingRequest,
      );

    this.logger.debug('User withdraw setting request created.', {
      userWithdrawSettingsRequestCreated,
    });

    return userWithdrawSettingsRequestCreated;
  }

  private async saveAndEmitApproveEvent(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSettingRequest> {
    const userWithdrawSettingsRequestCreated = await this.save(
      userWithdrawSettingRequest,
    );

    await this.utilService.createUserWithdrawSetting(
      userWithdrawSettingsRequestCreated,
    );
    this.eventEmitter.approved(userWithdrawSettingsRequestCreated);

    return userWithdrawSettingsRequestCreated;
  }

  private async createDecodedPixKey(
    user: User,
    pixKey: PixKey,
  ): Promise<DecodedPixKey> {
    const decodedPixKey = new DecodedPixKeyEntity({
      id: uuidV4(),
      user,
      key: pixKey.key,
      type: pixKey.type,
    });

    const decodedPixKeyCreated =
      await this.pixKeyService.createDecoded(decodedPixKey);

    this.logger.debug('Decoded pix key.', { decodedPixKeyCreated });

    return decodedPixKeyCreated;
  }

  private async create(
    id: UserWithdrawSettingRequest['id'],
    type: UserWithdrawSettingRequest['type'],
    balance: UserWithdrawSettingRequest['balance'],
    day: UserWithdrawSettingRequest['day'],
    weekDay: UserWithdrawSettingRequest['weekDay'],
    wallet: Wallet,
    user: User,
    transactionType: TransactionType,
    pixKey: PixKey,
  ) {
    const userWithdrawSettingRequest = new UserWithdrawSettingRequestEntity({
      id,
      type,
      balance,
      state: UserWithdrawSettingRequestState.CLOSED,
      closedAt: new Date(),
      wallet,
      user,
      transactionType,
      pixKey,
      ...(type === WithdrawSettingType.WEEKLY ? { weekDay } : {}),
      ...(type === WithdrawSettingType.MONTHLY ? { day } : {}),
    });

    return this.saveAndEmitApproveEvent(userWithdrawSettingRequest);
  }

  private async checkDocumentAndCreate(
    id: UserWithdrawSettingRequest['id'],
    type: UserWithdrawSettingRequest['type'],
    balance: UserWithdrawSettingRequest['balance'],
    day: UserWithdrawSettingRequest['day'],
    weekDay: UserWithdrawSettingRequest['weekDay'],
    wallet: Wallet,
    user: User,
    transactionType: TransactionType,
    pixKey: PixKey,
  ) {
    const decodedPixKey = await this.createDecodedPixKey(user, pixKey);

    const userWithdrawSettingRequest = new UserWithdrawSettingRequestEntity({
      id,
      type,
      balance,
      state: UserWithdrawSettingRequestState.CLOSED,
      closedAt: new Date(),
      wallet,
      user,
      transactionType,
      pixKey,
      decodedPixKey,
      ...(type === WithdrawSettingType.WEEKLY ? { weekDay } : {}),
      ...(type === WithdrawSettingType.MONTHLY ? { day } : {}),
    });

    if (pixKey.document !== decodedPixKey.document) {
      userWithdrawSettingRequest.state = UserWithdrawSettingRequestState.FAILED;

      throw new UserWithdrawSettingRequestDocumentWrongException(
        userWithdrawSettingRequest,
      );
    }

    return this.saveAndEmitApproveEvent(userWithdrawSettingRequest);
  }
}
