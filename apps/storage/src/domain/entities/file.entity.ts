import { Domain } from '@zro/common';

export interface File extends Domain<string> {
  id: string;
  fileName: string;
  folderName: string;
  gatewayName?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class FileEntity implements File {
  id: string;
  fileName: string;
  folderName: string;
  gatewayName?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: Partial<File>) {
    Object.assign(this, props);
  }
}
