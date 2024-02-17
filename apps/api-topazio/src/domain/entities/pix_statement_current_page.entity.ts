import { Domain } from '@zro/common';

export interface PixStatementCurrentPage extends Domain<string> {
  actualPage: number;
  createdDate: string;
}

export class PixStatementCurrentPageEntity implements PixStatementCurrentPage {
  actualPage: number;
  createdDate: string;

  constructor(props: Partial<PixStatementCurrentPage>) {
    Object.assign(this, props);
  }
}
