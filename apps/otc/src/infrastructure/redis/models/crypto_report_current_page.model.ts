import { IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  CryptoReportCurrentPage,
  CryptoReportCurrentPageEntity,
} from '@zro/otc/domain';

export type CryptoReportCurrentPageAttributes = CryptoReportCurrentPage;
export type CryptoReportCurrentPageCreateAttributes =
  CryptoReportCurrentPageAttributes;

export class CryptoReportCurrentPageModel
  extends AutoValidator
  implements CryptoReportCurrentPageAttributes
{
  @IsUUID(4)
  lastUpdatedCryptoReportId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  lastUpdatedCryptoReportCreatedAt: Date;

  constructor(props: Partial<CryptoReportCurrentPageAttributes>) {
    super(props);
  }

  toDomain(): CryptoReportCurrentPage {
    return new CryptoReportCurrentPageEntity(this);
  }
}
