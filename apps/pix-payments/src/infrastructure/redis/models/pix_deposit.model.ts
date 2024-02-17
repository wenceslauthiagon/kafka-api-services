import {
  IsDefined,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  AccountType,
  PixDeposit,
  PixDepositEntity,
  PixDepositState,
} from '@zro/pix-payments/domain';
import { Bank, BankEntity } from '@zro/banking/domain';
import {
  PersonDocumentType,
  PersonType,
  User,
  UserEntity,
} from '@zro/users/domain';

export type PixDepositAttributes = PixDeposit;
export type PixDepositCreateAttributes = PixDepositAttributes;

export class PixDepositRedisModel
  extends AutoValidator
  implements PixDepositAttributes
{
  @IsString()
  id: string;

  @IsDefined()
  user: User;

  @IsDefined()
  wallet: Wallet;

  @IsDefined()
  operation: Operation;

  @IsString()
  state: PixDepositState;

  @IsString()
  @IsOptional()
  txId: string;

  @IsString()
  @IsOptional()
  endToEndId: string;

  @IsInt()
  amount: number;

  @IsInt()
  @IsOptional()
  returnedAmount: number;

  @IsDefined()
  clientBank: Bank;

  @IsString()
  @IsOptional()
  clientBranch: string;

  @IsString()
  clientAccountNumber: string;

  @IsString()
  clientPersonType: PersonDocumentType;

  @IsString()
  clientDocument: string;

  @IsString()
  @IsOptional()
  clientName: string;

  @IsString()
  @IsOptional()
  clientKey: string;

  @IsDefined()
  thirdPartBank: Bank;

  @IsString()
  @IsOptional()
  thirdPartBranch: string;

  @IsString()
  @IsOptional()
  thirdPartAccountType: AccountType;

  @IsString()
  @IsOptional()
  thirdPartAccountNumber: string;

  @IsString()
  thirdPartPersonType: PersonDocumentType;

  @IsString()
  @IsOptional()
  thirdPartDocument: string;

  @IsString()
  @IsOptional()
  thirdPartName?: string;

  @IsString()
  @IsOptional()
  thirdPartKey: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  transactionTag: string;

  @IsObject()
  @IsOptional()
  check?: { [key: string]: boolean };

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: Partial<PixDepositAttributes>) {
    super(props);
  }

  toDomain(): PixDeposit {
    const entity = new PixDepositEntity(this);

    entity.user = new UserEntity({ uuid: this.user.uuid });
    entity.wallet = new WalletEntity({ uuid: this.wallet.uuid });
    entity.operation = new OperationEntity({ id: this.operation.id });
    entity.clientBank = new BankEntity({
      id: this.clientBank.id,
      ispb: this.clientBank.ispb,
      name: this.clientBank.name,
    });
    entity.thirdPartBank = new BankEntity({
      id: this.thirdPartBank.id,
      ispb: this.thirdPartBank.ispb,
      name: this.thirdPartBank.name,
    });

    return entity;
  }

  hasReceipt(): boolean {
    return this.toDomain().hasReceipt();
  }

  isInAnalysis(): boolean {
    return this.toDomain().isInAnalysis();
  }

  canCreateDevolution(intervalDays: number): boolean {
    return this.toDomain().canCreateDevolution(intervalDays);
  }

  getDocumentType(): PersonType {
    return this.toDomain().getDocumentType();
  }
}
