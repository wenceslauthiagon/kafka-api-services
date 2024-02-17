import { Op } from 'sequelize';
import {
  DatabaseRepository,
  getMoment,
  Pagination,
  PaginationEntity,
  PaginationOrder,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import {
  Operation,
  OperationAnalysisTag,
  OperationRepository,
  OperationRequestSort,
  OperationState,
  TGetAllOperationsGeneratorFilter,
  TGetOperationsFilter,
  TransactionType,
  WalletAccount,
} from '@zro/operations/domain';
import {
  CurrencyModel,
  OperationModel,
  TransactionTypeModel,
} from '@zro/operations/infrastructure';

export class OperationDatabaseRepository
  extends DatabaseRepository
  implements OperationRepository
{
  /**
   * Convert Operation model to Operation domain.
   * @param operation Model instance.
   * @returns {Domain} instance.
   */
  static toDomain(operation: OperationModel): Operation {
    return operation?.toDomain() ?? null;
  }

  /**
   * Create operation.
   *
   * @param operation New operation.
   * @returns Created operation.
   */
  async create(operation: Operation): Promise<Operation> {
    const createdOperation = await OperationModel.create(operation, {
      transaction: this.transaction,
    });

    operation.id = createdOperation.id;
    operation.createdAt = createdOperation.createdAt;

    return operation;
  }

  /**
   * Update operation.
   *
   * @param operation Operation to be updated.
   * @returns Updated operation.
   */
  async update(operation: Operation): Promise<Operation> {
    await OperationModel.update(operation, {
      where: { id: operation.id },
      transaction: this.transaction,
    });

    return operation;
  }

  /**
   * Get operation by ID.
   * @param id Operation UUID.
   * @returns Operation found or null otherwise.
   */
  async getById(id: string): Promise<Operation> {
    return OperationModel.findOne({
      where: { id },
      transaction: this.transaction,
    }).then(OperationDatabaseRepository.toDomain);
  }

  /**
   * Get operation by ID with transactionType.
   * @param id Operation UUID.
   * @returns Operation found or null otherwise.
   */
  async getWithTransactionTypeById(id: string): Promise<Operation> {
    return OperationModel.findOne<OperationModel>({
      where: { id },
      include: { model: TransactionTypeModel, attributes: ['id', 'tag'] },
      transaction: this.transaction,
    }).then(OperationDatabaseRepository.toDomain);
  }

  /**
   * Get operations by owner wallet account and created after day.
   *
   * @param walletAccount Owner wallet account.
   * @param date Date for search operations.
   * @param transactionTypes Transaction types.
   * @returns Operations list if found or empty list otherwise.
   */
  async getValueAndCreatedAtByOwnerWalletAccountAndCreatedAtAfterAndTransactionTypeAndStateIn(
    walletAccount: WalletAccount,
    date: string,
    transactionTypes: TransactionType[],
    states: OperationState[],
  ) {
    return OperationModel.findAll({
      attributes: ['value', 'createdAt'],
      where: {
        ownerWalletAccountId: walletAccount.id,
        createdAt: { [Op.gte]: date },
        transactionTypeId: {
          [Op.in]: transactionTypes.map(
            (transactionType) => transactionType.id,
          ),
        },
        state: states,
      },
      transaction: this.transaction,
    }).then((operations) =>
      operations.map(OperationDatabaseRepository.toDomain),
    );
  }

  /**
   * Get operations by beneficiary wallet account and created after day.
   *
   * @param walletAccount Beneficiary wallet account.
   * @param date Date for search operations.
   * @param transactionTypes Transaction types.
   * @returns Operations list if found or empty list otherwise.
   */
  async getValueAndCreatedAtByBeneficiaryWalletAccountAndCreatedAtAfterAndTransactionTypeAndStateIn(
    walletAccount: WalletAccount,
    date: string,
    transactionTypes: TransactionType[],
    states: OperationState[],
  ) {
    return OperationModel.findAll<OperationModel>({
      attributes: ['value', 'createdAt'],
      where: {
        beneficiaryWalletAccountId: walletAccount.id,
        createdAt: { [Op.gte]: date },
        transactionTypeId: {
          [Op.in]: transactionTypes.map(
            (transactionType) => transactionType.id,
          ),
        },
        state: states,
      },
      transaction: this.transaction,
    }).then((operations) =>
      operations.map(OperationDatabaseRepository.toDomain),
    );
  }

  /**
   * Get all operations by wallet accounts and filter.
   * @param walletAccounts WalletAccounts[].
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns Operation[]
   */
  async getAllByWalletAccountsAndFilter(
    walletAccounts: WalletAccount[],
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ): Promise<TPaginationResponse<Operation>> {
    const walletAccountsIds = walletAccounts.map(
      (walletAccount) => walletAccount.id,
    );

    const {
      createdAtStart,
      createdAtEnd,
      currencySymbol,
      transactionTag,
      value,
      states,
    } = filter;

    const where = {
      [Op.or]: [
        { ownerWalletAccountId: walletAccountsIds },
        { beneficiaryWalletAccountId: walletAccountsIds },
      ],
      ...(filter.createdAtStart &&
        filter.createdAtEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtStart).startOf('day').toISOString(),
              getMoment(createdAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
      ...(filter.value && {
        value,
      }),
      ...(filter.states && {
        state: {
          [Op.in]: states,
        },
      }),
    };

    const include = [
      {
        model: CurrencyModel,
        required: true,
        where: {
          ...(currencySymbol && { symbol: currencySymbol }),
        },
      },
      {
        model: TransactionTypeModel,
        required: true,
        where: {
          ...(transactionTag && { tag: transactionTag }),
        },
      },
    ];

    return OperationModel.findAndCountAll<OperationModel>({
      ...paginationWhere(pagination),
      where,
      include,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(OperationDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get operation by wallets accounts and id.
   * @param walletAccounts WalletAccounts[].
   * @param id Operation id.
   * @return Operation if found or null otherwise.
   */
  async getByWalletAccountsAndId(
    walletAccounts: WalletAccount[],
    id: string,
  ): Promise<Operation> {
    const walletAccountsIds = walletAccounts.map(
      (walletAccount) => walletAccount.id,
    );

    const where = {
      [Op.or]: [
        { ownerWalletAccountId: walletAccountsIds },
        { beneficiaryWalletAccountId: walletAccountsIds },
      ],
      id,
    };

    const include = [
      {
        model: CurrencyModel,
        required: true,
      },
      {
        model: TransactionTypeModel,
        required: true,
      },
    ];

    return OperationModel.findOne<OperationModel>({
      where,
      include,
      transaction: this.transaction,
    }).then(OperationDatabaseRepository.toDomain);
  }

  /**
   * Get all Operations by filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns Operation[]
   */
  async getAllByFilter(
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ): Promise<TPaginationResponse<Operation>> {
    const { createdAtStart, createdAtEnd, currencyTag, transactionTag } =
      filter;

    const where = {
      ...(filter.createdAtStart &&
        filter.createdAtEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtStart).startOf('day').toISOString(),
              getMoment(createdAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
      ...(filter.nonChargeback && {
        chargeback: {
          [Op.eq]: null,
        },
      }),
    };

    const include = [
      {
        model: CurrencyModel,
        required: true,
        where: {
          ...(currencyTag && { tag: currencyTag }),
        },
      },
      {
        model: TransactionTypeModel,
        required: true,
        where: {
          ...(transactionTag && { tag: transactionTag }),
        },
      },
    ];

    return OperationModel.findAndCountAll<OperationModel>({
      ...paginationWhere(pagination),
      where,
      include,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(OperationDatabaseRepository.toDomain),
      ),
    );
  }

  async *getAllByFilterGenerator(
    filter: TGetAllOperationsGeneratorFilter,
    pageSize = 100,
  ) {
    const { where, include } = this._getWhereAndInclusions(filter);

    let page = 1;
    const pagination = new PaginationEntity({
      page,
      pageSize,
      sort: OperationRequestSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    let operationsPaginated = await this._getPaginated(
      pagination,
      where,
      include,
    );

    while (page <= operationsPaginated.pageTotal) {
      yield operationsPaginated.data;

      page += 1;

      if (page <= operationsPaginated.pageTotal) {
        operationsPaginated = await this._getPaginated(
          { ...pagination, page },
          where,
          include,
        );
      }
    }
  }

  private _getPaginated(pagination: Pagination, where, include) {
    return OperationModel.findAndCountAll<OperationModel>({
      ...paginationWhere(pagination),
      where,
      include,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(OperationDatabaseRepository.toDomain),
      ),
    );
  }

  private _getWhereAndInclusions(filter: TGetAllOperationsGeneratorFilter) {
    const {
      createdAtStart,
      createdAtEnd,
      transactionTag,
      nonChargeback,
      currencyId,
    } = filter;

    const where = {
      currencyId,
      createdAt: {
        [Op.between]: [
          getMoment(createdAtStart).startOf('day').toISOString(),
          getMoment(createdAtEnd).endOf('day').toISOString(),
        ],
      },
      ...(nonChargeback && {
        chargeback: {
          [Op.eq]: null,
        },
      }),
    };

    const include = [
      {
        model: TransactionTypeModel,
        required: true,
        where: {
          ...(transactionTag && { tag: transactionTag }),
        },
      },
    ];

    return { where, include };
  }

  /**
   * Get all Operations by analysis tag.
   * @param pagination Pagination.
   * @param analysisTag Analysis tag.
   * @param date Before the date.
   * @returns Operation[]
   */
  async getAllByPaginationAndAnalysisTagBeforeDate(
    pagination: Pagination,
    analysisTag: OperationAnalysisTag,
    date: Date,
  ): Promise<TPaginationResponse<Operation>> {
    return OperationModel.findAndCountAll<OperationModel>({
      ...paginationWhere(pagination),
      where: {
        analysisTags: {
          [Op.contains]: [analysisTag],
        },
        createdAt: {
          [Op.lt]: date,
        },
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(OperationDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Update operation analysis tags.
   *
   * @param operation Operation to be updated.
   * @returns Updated operation.
   */
  async updateAnalysisTags(
    operation: Partial<Operation>,
  ): Promise<Partial<Operation>> {
    await OperationModel.update(
      { analysisTags: operation.analysisTags },
      {
        where: { id: operation.id },
        transaction: this.transaction,
      },
    );

    return operation;
  }
}
