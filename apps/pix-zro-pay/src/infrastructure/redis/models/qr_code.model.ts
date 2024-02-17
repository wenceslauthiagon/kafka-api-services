import {
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  BankAccount,
  Client,
  Company,
  QrCode,
  QrCodeEntity,
} from '@zro/pix-zro-pay/domain';

export type QrCodeAttributes = QrCode;
export type QrCodeCreateAttributes = QrCodeAttributes;

export class QrCodeModel extends AutoValidator implements QrCodeAttributes {
  @IsUUID(4)
  transactionUuid: string;

  @IsString()
  txId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  payerDocument?: number;

  @IsString()
  emv: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  value?: number;

  @IsDefined()
  company: Company;

  @IsDefined()
  bankAccount: BankAccount;

  @IsDefined()
  client: Client;

  @IsString()
  merchantId: string;

  @IsString()
  gatewayName: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: Partial<QrCodeAttributes>) {
    super(props);
  }

  toDomain(): QrCode {
    const entity = new QrCodeEntity(this);

    return entity;
  }
}
