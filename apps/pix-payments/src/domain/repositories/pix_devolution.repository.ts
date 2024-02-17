import { Pagination, TPaginationResponse } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  PixDevolution,
  PixDeposit,
  PixDevolutionState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';

export interface PixDevolutionRepository {
  /**
   * Insert a PixDevolution.
   * @param devolution Devolution to save.
   * @returns Created devolution.
   */
  create(devolution: PixDevolution): Promise<PixDevolution>;

  /**
   * Update a Devolution.
   * @param Devolution Devolution to update.
   * @returns Updated devolution.
   */
  update(devolution: PixDevolution): Promise<PixDevolution>;

  /**
   * get a Devolution by id.
   * @param id Devolution id to get.
   * @returns Get devolution.
   */
  getById(id: string): Promise<PixDevolution>;

  /**
   * get a Devolution by id.
   * @param id Devolution id to get.
   * @returns Get devolution with deposit.
   */
  getWithDepositById(id: string): Promise<PixDevolution>;

  /**
   * get a Devolution by id and wallet.
   * @param id Devolution id to get.
   * @param wallet wallet to get.
   * @returns Get devolution.
   */
  getByIdAndWallet(id: string, wallet: Wallet): Promise<PixDevolution>;

  /**
   * get a Devolution by id and wallet.
   * @param id Devolution id to get.
   * @param wallet wallet to get.
   * @returns Get devolution with deposit.
   */
  getWithDepositByIdAndWallet(
    id: string,
    wallet: Wallet,
  ): Promise<PixDevolution>;

  /**
   * get a Devolution quantity by deposit.
   * @param deposit Devolution deposit id to get.
   * @returns Get devolution quantity.
   */
  countByDeposit(deposit: PixDeposit): Promise<number>;

  /**
   * get the total devolution amount by deposit.
   * @param deposit deposit to get.
   * @returns Get total devolution amount.
   */
  getTotalDevolutionAmountByDeposit(deposit: PixDeposit): Promise<number>;

  /**
   * get all devolutions by state.
   * @param state Devolution state to update.
   * @returns Get devolutions
   */
  getAllByState(state: PixDevolutionState): Promise<PixDevolution[]>;

  /**
   * get a devolution by operation and wallet.
   * @param operation devolution operation.
   * @param wallet devolution wallet.
   * @returns get devolution.
   */
  getByOperationAndWallet(
    operation: Operation,
    wallet: Wallet,
  ): Promise<PixDevolution>;

  /**
   * get a devolution by operation.
   * @param operation devolution operation.
   * @returns get devolution.
   */
  getByOperation(operation: Operation): Promise<PixDevolution>;

  /**
   * List all Devolutions.
   * @param pagination The pagination.
   * @param user Devolution's user.
   * @param wallet Devolution's wallet.
   * @param createdAtPeriodStart Start created payment date.
   * @param createdAtPeriodEnd End created payment date.v
   * @param endToEndId End to end id of deposit.
   * @param clientDocument Client document of deposit.
   * @param states Pix devolution state.
   * @return Devolutions found.
   */
  getAll(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
    states?: PixDevolutionState[],
  ): Promise<TPaginationResponse<PixDevolution>>;

  /**
   * List all Devolutions with Deposit.
   * @param pagination The pagination.
   * @param user Devolution's user.
   * @param wallet Devolution's wallet.
   * @param createdAtPeriodStart Start created payment date.
   * @param createdAtPeriodEnd End created payment date.v
   * @param endToEndId End to end id of deposit.
   * @param clientDocument Client document of deposit.
   * @param states Pix devolution state.
   * @return Devolutions found.
   */
  getAllWithDeposit(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
    states?: PixDevolutionState[],
  ): Promise<TPaginationResponse<PixDevolution>>;

  /**
   * Get all pix devolution by state, threshold date and date comparison type.
   * @param state State payment to update.
   * @param date Threshold date to be compared.
   * @param comparisonType Date comparison type.
   * @returns Pix devolution found.
   */
  getAllByStateAndThresholdDate(
    state: PixDevolutionState,
    date: Date,
    comparisonType: ThresholdDateComparisonType,
  ): Promise<PixDevolution[]>;
}
