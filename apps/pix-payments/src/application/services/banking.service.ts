import { Bank } from '@zro/banking/domain';

export interface BankingService {
  /**
   * Get bank by ispb.
   * @param ispb The ispb code.
   * @returns found bank.
   */
  getBankByIspb(ispb: string): Promise<Bank>;
}
