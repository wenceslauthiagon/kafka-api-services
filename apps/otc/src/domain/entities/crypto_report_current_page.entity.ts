import { Domain } from '@zro/common';

export interface CryptoReportCurrentPage extends Domain<string> {
  lastUpdatedCryptoReportId: string;
  lastUpdatedCryptoReportCreatedAt: Date;
}

export class CryptoReportCurrentPageEntity implements CryptoReportCurrentPage {
  lastUpdatedCryptoReportId: string;
  lastUpdatedCryptoReportCreatedAt: Date;

  constructor(props: Partial<CryptoReportCurrentPage>) {
    Object.assign(this, props);
  }
}
