import { WarningPixDepositBankBlockList } from '@zro/pix-payments/domain';

export interface WarningPixDepositBankBlockListRepository {
  /**
   * get bank blocked by cnpj.
   * @returns bank blocked by cnpj.
   */
  getByCnpj: (id: string) => Promise<WarningPixDepositBankBlockList>;
}
