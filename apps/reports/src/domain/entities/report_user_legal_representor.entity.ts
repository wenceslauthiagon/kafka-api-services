import { Domain } from '@zro/common';
import { UserLegalRepresentor } from '@zro/users/domain';

/**
 * Report User Legal Representor.
 */
export interface ReportUserLegalRepresentor extends Domain<string> {
  userLegalRepresentor: UserLegalRepresentor;
  createdAt: Date;
  updatedAt: Date;
}

export class ReportUserLegalRepresentorEntity
  implements ReportUserLegalRepresentor
{
  id!: string;
  userLegalRepresentor: UserLegalRepresentor;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<ReportUserLegalRepresentor>) {
    Object.assign(this, props);
  }
}
