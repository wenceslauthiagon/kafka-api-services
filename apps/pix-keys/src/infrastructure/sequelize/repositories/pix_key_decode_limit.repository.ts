import { DatabaseRepository } from '@zro/common';
import { PersonType } from '@zro/users/domain';
import {
  PixKeyDecodeLimit,
  PixKeyDecodeLimitRepository,
} from '@zro/pix-keys/domain';
import { PixKeyDecodeLimitModel } from '@zro/pix-keys/infrastructure';

export class PixKeyDecodeLimitDatabaseRepository
  extends DatabaseRepository
  implements PixKeyDecodeLimitRepository
{
  static toDomain(
    pixKeyDecodeLimitModel: PixKeyDecodeLimitModel,
  ): PixKeyDecodeLimit {
    return pixKeyDecodeLimitModel?.toDomain() ?? null;
  }

  async getByPersonType(personType: PersonType): Promise<PixKeyDecodeLimit> {
    return PixKeyDecodeLimitModel.findOne<PixKeyDecodeLimitModel>({
      where: { personType },
      transaction: this.transaction,
    }).then(PixKeyDecodeLimitDatabaseRepository.toDomain);
  }
}
