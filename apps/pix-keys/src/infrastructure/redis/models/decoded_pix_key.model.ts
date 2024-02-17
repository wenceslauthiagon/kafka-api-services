import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  DecodedPixKey,
  DecodedPixKeyEntity,
  DecodedPixKeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { PersonType, User, UserEntity } from '@zro/users/domain';

export type DecodedPixKeyAttributes = DecodedPixKey;
export type DecodedPixKeyCreateAttributes = DecodedPixKeyAttributes;

export class DecodedPixKeyRedisModel
  extends AutoValidator
  implements DecodedPixKeyAttributes
{
  @IsUUID(4)
  id: string;

  @IsObject()
  user: User;

  @IsEnum(KeyType)
  type: KeyType;

  @IsString()
  key: string;

  @IsEnum(PersonType)
  personType: PersonType;

  @IsString()
  document: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsString()
  accountNumber: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsString()
  branch: string;

  @IsString()
  ispb: string;

  @IsBoolean()
  activeAccount: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format accountOpeningDate',
  })
  accountOpeningDate: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format keyCreationDate',
  })
  keyCreationDate: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format keyOwnershipDate',
  })
  keyOwnershipDate?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format claimRequestDate',
  })
  claimRequestDate?: Date;

  @IsOptional()
  @IsString()
  endToEndId?: string;

  @IsOptional()
  @IsString()
  cidId?: string;

  @IsOptional()
  @IsNumber()
  dictAccountId?: number;

  @IsEnum(DecodedPixKeyState)
  state: DecodedPixKeyState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: DecodedPixKeyAttributes) {
    super(props);
  }

  toDomain(): DecodedPixKey {
    const entity = new DecodedPixKeyEntity(this);
    entity.user = new UserEntity({ uuid: this.user.uuid });
    return entity;
  }
}
