import { Domain } from '@zro/common';
import { File } from '@zro/storage/domain';
import { Remittance } from './remittance.entity';

export interface ExchangeContract extends Domain<string> {
  contractNumber?: string;
  vetQuote?: number;
  contractQuote: number;
  totalAmount: number;
  remittances?: Remittance[];
  file?: File;
  createdAt?: Date;
}

export class ExchangeContractEntity implements ExchangeContract {
  id: string;
  contractNumber?: string;
  vetQuote?: number;
  contractQuote: number;
  totalAmount: number;
  remittances?: Remittance[];
  file?: File;
  createdAt?: Date;

  constructor(props: Partial<ExchangeContract>) {
    Object.assign(this, props);
  }
}
