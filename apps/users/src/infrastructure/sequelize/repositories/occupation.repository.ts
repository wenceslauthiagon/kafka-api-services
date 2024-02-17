import { DatabaseRepository } from '@zro/common';
import { Occupation, OccupationRepository } from '@zro/users/domain';
import { OccupationModel } from '@zro/users/infrastructure';

export class OccupationDatabaseRepository
  extends DatabaseRepository
  implements OccupationRepository
{
  static toDomain(occupationModel: OccupationModel): Occupation {
    return occupationModel?.toDomain() ?? null;
  }

  async getByCodCbo(codCbo: number): Promise<Occupation> {
    return OccupationModel.findOne<OccupationModel>({
      where: { codCbo },
      transaction: this.transaction,
    }).then(OccupationDatabaseRepository.toDomain);
  }
}
