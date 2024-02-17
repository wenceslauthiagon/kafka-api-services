import { Logger } from 'winston';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import {
  OperationService,
  UserService,
  UserWithdrawSettingRequestEventEmitter,
  UserWithdrawSettingRequestGateway,
  UserWithdrawSettingRequestNotFoundException,
} from '@zro/compliance/application';
import { MissingDataException } from '@zro/common';

export class HandleUserWithdrawSettingRequestPendingUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRequestRepository user withdraw setting request repository.
   * @param userWithdrawSettingRequestGateway user withdraw setting request gateway.
   * @param eventEmitter user withdraw setting request event emitter.
   * @param userService User service.
   * @param operationService operation service.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    private readonly userWithdrawSettingRequestGateway: UserWithdrawSettingRequestGateway,
    private readonly eventEmitter: UserWithdrawSettingRequestEventEmitter,
    private readonly userService: UserService,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandleUserWithdrawSettingRequestPendingUseCase.name,
    });
  }

  /**
   * Handle pending user withdraw setting request event.
   */
  async execute(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<void> {
    if (!userWithdrawSettingRequest?.id) {
      throw new MissingDataException(['User withdraw setting request id']);
    }

    const userWithdrawSettingRequestFound =
      await this.userWithdrawSettingRequestRepository.getById(
        userWithdrawSettingRequest.id,
      );

    this.logger.debug('User withdraw setting request found.', {
      userWithdrawSettingRequestFound,
    });

    if (!userWithdrawSettingRequestFound) {
      throw new UserWithdrawSettingRequestNotFoundException(
        userWithdrawSettingRequest,
      );
    }

    if (
      userWithdrawSettingRequestFound.state !=
      UserWithdrawSettingRequestState.PENDING
    ) {
      return;
    }

    // Get user information
    if (userWithdrawSettingRequestFound.user?.uuid) {
      const user = await this.userService.getByUuid(
        userWithdrawSettingRequestFound.user.uuid,
      );

      this.logger.debug('User found.', {
        user,
      });

      userWithdrawSettingRequestFound.user = user;
    }

    // Get transaction type information
    if (userWithdrawSettingRequestFound.transactionType?.tag) {
      const transactionType =
        await this.operationService.getTransactionTypeByTag(
          userWithdrawSettingRequestFound.transactionType.tag,
        );

      this.logger.debug('Transaction type found.', {
        transactionType,
      });

      userWithdrawSettingRequestFound.transactionType = transactionType;
    }

    // Get wallet information
    if (userWithdrawSettingRequestFound.wallet?.uuid) {
      const wallet = await this.operationService.getWalletByUuid(
        userWithdrawSettingRequestFound.wallet.uuid,
      );

      this.logger.debug('Wallet found.', {
        wallet,
      });

      userWithdrawSettingRequestFound.wallet = wallet;
    }

    const response = await this.userWithdrawSettingRequestGateway.create(
      userWithdrawSettingRequestFound,
    );

    this.logger.debug('User withdraw setting request created in gateway.', {
      response,
    });

    userWithdrawSettingRequestFound.issueId = response.issueId;
    userWithdrawSettingRequestFound.state =
      UserWithdrawSettingRequestState.OPEN;

    const userWithdrawSettingRequestUpdated =
      await this.userWithdrawSettingRequestRepository.update(
        userWithdrawSettingRequestFound,
      );

    this.logger.debug('User withdraw setting request updated.', {
      userWithdrawSettingRequestUpdated,
    });

    this.eventEmitter.open(userWithdrawSettingRequestUpdated);
  }
}
