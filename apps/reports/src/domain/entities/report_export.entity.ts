import { Domain } from '@zro/common';

export interface ReportExport extends Domain<string> {
  destFileName: string;
  createdAt: Date;
  finishedAt?: Date;
}

export class ReportExportEntity implements ReportExport {
  id: string;
  destFileName: string;
  createdAt: Date;
  finishedAt?: Date;

  constructor(props: Partial<ReportExport>) {
    Object.assign(this, props);
  }
}
