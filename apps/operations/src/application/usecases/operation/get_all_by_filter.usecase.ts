import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  Operation,
  OperationRepository,
  TGetOperationsFilter,
  WalletAccountRepository,
} from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';

export class GetAllOperationsByFilterUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationRepository Operation repository.
   * @param walletAccountRepository WalletAccount repository.
   * @param userService User service.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetAllOperationsByFilterUseCase.name,
    });
  }

  /**
   * Get all Operations by filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns Operation[].
   */
  async execute(
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ): Promise<TPaginationResponse<Operation>> {
    // Data input check
    if (!pagination || !filter) {
      throw new MissingDataException([
        ...(!pagination ? ['Pagination'] : []),
        ...(!filter ? ['Filter'] : []),
      ]);
    }

    const result = await this.operationRepository.getAllByFilter(
      pagination,
      filter,
    );

    this.logger.debug('Operations found.', { result });

    if (result?.data?.length) {
      for (const operation of result.data) {
        operation.owner =
          operation.owner &&
          (await this.userService.getUserById(operation.owner.id));

        operation.ownerWalletAccount =
          operation.ownerWalletAccount &&
          (await this.walletAccountRepository.getById(
            operation.ownerWalletAccount.id,
          ));

        operation.beneficiary =
          operation.beneficiary &&
          (await this.userService.getUserById(operation.beneficiary.id));

        operation.beneficiaryWalletAccount =
          operation.beneficiaryWalletAccount &&
          (await this.walletAccountRepository.getById(
            operation.beneficiaryWalletAccount.id,
          ));
      }
    }

    return result;
  }
}
