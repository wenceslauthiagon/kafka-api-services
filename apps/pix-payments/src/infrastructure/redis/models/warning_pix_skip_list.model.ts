import { IsDefined, IsOptional, IsString } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  WarningPixSkipList,
  WarningPixSkipListEntity,
} from '@zro/pix-payments/domain';
import { User, UserEntity } from '@zro/users/domain';

export type WarningPixSkipListAttributes = WarningPixSkipList;
export type WarningPixSkipListCreateAttributes = WarningPixSkipListAttributes;

export class WarningPixSkipListRedisModel
  extends AutoValidator
  implements WarningPixSkipListAttributes
{
  @IsString()
  id: string;

  @IsDefined()
  user: User;

  @IsString()
  clientAccountNumber: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: Partial<WarningPixSkipListAttributes>) {
    super(props);
  }

  toDomain(): WarningPixSkipList {
    const entity = new WarningPixSkipListEntity(this);

    entity.user = new UserEntity({
      uuid: this.user.uuid,
    });

    return entity;
  }
}
