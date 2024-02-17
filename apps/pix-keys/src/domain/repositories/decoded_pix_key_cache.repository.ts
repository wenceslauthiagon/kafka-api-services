import { DecodedPixKey } from '@zro/pix-keys/domain';

export interface DecodedPixKeyCacheRepository {
  /**
   * get a DecodedPixKey by hash.
   * @param hash Deposit hash.
   * @returns Found deposit.
   */
  getByHash(hash: string): Promise<DecodedPixKey>;

  /**
   * Create a DecodedPixKey hash.
   * @param hash Deposit hash.
   * @param deposit Deposit to save.
   * @returns Created Deposit.
   */
  createHash(hash: string, deposit: DecodedPixKey): Promise<DecodedPixKey>;
}
