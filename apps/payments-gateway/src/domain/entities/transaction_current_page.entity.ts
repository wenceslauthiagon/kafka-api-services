import { Domain } from '@zro/common';

export interface TransactionCurrentPage extends Domain<string> {
  actualPage: number;
  createdDate: string;
}

export class TransactionCurrentPageEntity implements TransactionCurrentPage {
  actualPage: number;
  createdDate: string;

  constructor(props: Partial<TransactionCurrentPage>) {
    Object.assign(this, props);
  }
}
