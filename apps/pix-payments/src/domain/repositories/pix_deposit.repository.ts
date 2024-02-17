import { Pagination, TPaginationResponse } from '@zro/common';
import { Operation, Wallet } from '@zro/operations/domain';
import { PixDeposit, PixDepositState } from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export interface PixDepositRepository {
  /**
   * Insert a PixDeposit.
   * @param deposit Deposit to save.
   * @returns Created Deposit.
   */
  create(deposit: PixDeposit): Promise<PixDeposit>;

  /**
   * Update a PixDeposit.
   * @param deposit PixDeposit to update.
   * @returns Updated devolution.
   */
  update(deposit: PixDeposit): Promise<PixDeposit>;

  /**
   * get a Deposit by id.
   * @param id Deposit id to get.
   * @returns get Deposit.
   */
  getById(id: string): Promise<PixDeposit>;

  /**
   * get a Deposit by id and wallet.
   * @param id Deposit id to get.
   * @param wallet id to get.
   * @returns get Deposit.
   */
  getByIdAndWallet(id: string, wallet: Wallet): Promise<PixDeposit>;

  /**
   * get a Deposit by operation.
   * @param operation Deposit operation to get.
   * @returns get Deposit.
   */
  getByOperation(operation: Operation): Promise<PixDeposit>;

  /**
   * get a PixDeposit by operation and wallet.
   * @param operation PixDeposit operation.
   * @param wallet PixDeposit wallet.
   * @returns get PixDeposit.
   */
  getByOperationAndWallet(
    operation: Operation,
    wallet: Wallet,
  ): Promise<PixDeposit>;

  /**
   * get a Deposit by endToEndId.
   * @param endToEndId Deposit endToEndId to get.
   * @returns get Deposit.
   */
  getByEndToEndId(endToEndId: string): Promise<PixDeposit>;

  /**
   * Get a Deposit by id or endToEndId.
   * @param id Deposit id to get.
   * @param endToEndId Deposit endToEndId to get.
   * @returns get Deposit.
   */
  getByIdOrEndToEndId(id: string, endToEndId: string): Promise<PixDeposit>;

  /**
   * List all Deposits.
   * @param pagination The pagination.
   * @param user Deposit's user.
   * @param wallet Deposit's wallet.
   * @param createdAtPeriodStart Start created payment date.
   * @param createdAtPeriodEnd End created payment date.v
   * @param endToEndId End to end id of deposit.
   * @param clientDocument Client document of deposit.
   * @param states Pix deposit states.
   * @return Deposits found.
   */
  getAll(
    pagination: Pagination,
    user: User,
    wallet: Wallet,
    createdAtPeriodStart: Date,
    createdAtPeriodEnd: Date,
    endToEndId: string,
    clientDocument: string,
    states: PixDepositState[],
  ): Promise<TPaginationResponse<PixDeposit>>;
}
