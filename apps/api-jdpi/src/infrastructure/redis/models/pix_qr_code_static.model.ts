import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { QrCodeStatic, QrCodeStaticEntity } from '@zro/pix-payments/domain';

type QrCodeStaticAttributes = Pick<
  QrCodeStatic,
  'txId' | 'documentValue' | 'expirationDate' | 'payableManyTimes'
>;

export class QrCodeStaticModel
  extends AutoValidator
  implements QrCodeStaticAttributes
{
  @IsString()
  @MaxLength(25)
  txId: string;

  @IsOptional()
  @IsInt()
  documentValue?: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  @IsOptional()
  expirationDate?: Date;

  @IsBoolean()
  payableManyTimes: boolean;

  constructor(props: Partial<QrCodeStaticAttributes>) {
    super(props);
  }

  toDomain(): QrCodeStatic {
    const entity = new QrCodeStaticEntity(this);
    return entity;
  }
}
