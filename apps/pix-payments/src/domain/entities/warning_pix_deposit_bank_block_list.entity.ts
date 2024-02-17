import { Domain } from '@zro/common';

/**
 * WarningPixDepositBankBlockList.
 */
export interface WarningPixDepositBankBlockList extends Domain<string> {
  name: string;
  cnpj: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WarningPixDepositBankBlockListEntity
  implements WarningPixDepositBankBlockList
{
  id: string;
  name: string;
  cnpj: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<WarningPixDepositBankBlockList>) {
    Object.assign(this, props);
  }
}
