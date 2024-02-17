import { DatabaseRepository } from '@zro/common';
import {
  GlobalLimit,
  GlobalLimitRepository,
  LimitType,
} from '@zro/operations/domain';
import { GlobalLimitModel } from '@zro/operations/infrastructure';

export class GlobalLimitDatabaseRepository
  extends DatabaseRepository
  implements GlobalLimitRepository
{
  /**
   * Convert GlobalLimit model to GlobalLimit domain.
   * @param globalLimit Model instance.
   * @returns Domain instance.
   */
  static toDomain(globalLimit: GlobalLimitModel): GlobalLimit {
    return globalLimit?.toDomain() ?? null;
  }

  /**
   * Get user limits by user and limit type.
   *
   * @param limitType Limit type.
   * @returns Global limit if found or null otherwise.
   */
  getByLimitType(limitType: LimitType): Promise<GlobalLimit> {
    return GlobalLimitModel.findOne({
      where: {
        limitTypeId: limitType.id,
      },
      transaction: this.transaction,
    }).then(GlobalLimitDatabaseRepository.toDomain);
  }
}
