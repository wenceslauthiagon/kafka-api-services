import { Pagination, TPaginationResponse } from '@zro/common';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  PixDevolutionReceived,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export interface PixDevolutionReceivedRepository {
  /**
   * Insert a PixDevolutionReceived.
   * @param devolutionReceived PixDevolutionReceived to save.
   * @returns Created PixDevolutionReceived.
   */
  create(
    devolutionReceived: PixDevolutionReceived,
  ): Promise<PixDevolutionReceived>;

  /**
   * Update a devolutionReceived.
   * @param devolutionReceived PixDevolutionReceived to update.
   * @returns Updated devolutionReceived.
   */
  update(
    devolutionReceived: PixDevolutionReceived,
  ): Promise<PixDevolutionReceived>;

  /**
   * get a PixDevolutionReceived by id.
   * @param id PixDevolutionReceived id to get.
   * @returns get PixDevolutionReceived.
   */
  getById(id: string): Promise<PixDevolutionReceived>;

  /**
   * Get a PixDevolutionReceived by id and wallet.
   * @param id PixDevolutionReceived id to get.
   * @param wallet User to found.
   * @returns get PixDevolutionReceived.
   */
  getByIdAndWallet(id: string, wallet: Wallet): Promise<PixDevolutionReceived>;

  /**
   * get a PixDevolutionReceived by operation and wallet.
   * @param operation PixDevolutionReceived operation.
   * @param wallet PixDevolutionReceived wallet.
   * @returns get PixDevolutionReceived.
   */
  getByOperationAndWallet(
    operation: Operation,
    wallet: Wallet,
  ): Promise<PixDevolutionReceived>;

  /**
   * get a PixDevolutionReceived by operation.
   * @param operation PixDevolutionReceived operation.
   * @returns get PixDevolutionReceived.
   */
  getByOperation(operation: Operation): Promise<PixDevolutionReceived>;

  /**
   * get a PixDevolutionReceived by endToEndId.
   * @param endToEndId Deposit endToEndId to get.
   * @returns get PixDevolutionReceived.
   */
  getByEndToEndId(endToEndId: string): Promise<PixDevolutionReceived>;

  /**
   * Get a PixDevolutionReceived by id or endToEndId.
   * @param PixDevolutionReceived id to get
   * @param endToEndId Deposit endToEndId to get.
   * @returns get PixDevolutionReceived.
   */
  getByIdOrEndToEndId(
    id: string,
    endToEndId: string,
  ): Promise<PixDevolutionReceived>;

  /**
   * List all Devolutions received.
   * @param pagination The pagination.
   * @param user Devolution's user.
   * @param wallet Devolution's wallet.
   * @param createdAtPeriodStart Start created payment date.
   * @param createdAtPeriodEnd End created payment date.v
   * @param endToEndId End to end id of deposit.
   * @param clientDocument Client document of deposit.
   * @param states Pix devolution received state.
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
    states?: PixDevolutionReceivedState[],
  ): Promise<TPaginationResponse<PixDevolutionReceived>>;
}
