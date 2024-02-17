import { PixDeposit } from '@zro/pix-payments/domain';

export interface PixDepositCacheRepository {
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
   * Update a PixDeposit using semaphore.
   * @param id Deposit id to get.
   * @param callback Callback function.
   * @returns Pix Deposit.
   */
  semaphore(
    id: string,
    callback: () => Promise<PixDeposit>,
  ): Promise<PixDeposit>;

  /**
   * get a PixDeposit by hash.
   * @param hash Deposit hash.
   * @returns Found deposit.
   */
  getByHash(hash: string): Promise<PixDeposit>;

  /**
   * Create a PixDeposit hash.
   * @param hash Deposit hash.
   * @param deposit Deposit to save.
   * @returns Created Deposit.
   */
  createHash(hash: string, deposit: PixDeposit): Promise<PixDeposit>;
}
