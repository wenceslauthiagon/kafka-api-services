import { Op } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { PixKeyClaim, PixKeyClaimRepository } from '@zro/pix-keys/domain';
import { PixKeyClaimModel } from '@zro/pix-keys/infrastructure';

export class PixKeyClaimDatabaseRepository
  extends DatabaseRepository
  implements PixKeyClaimRepository
{
  static toDomain(pixKeyClaimModel: PixKeyClaimModel): PixKeyClaim {
    return pixKeyClaimModel?.toDomain() ?? null;
  }

  async create(pixKeyClaim: PixKeyClaim): Promise<PixKeyClaim> {
    const createdPixKey = await PixKeyClaimModel.create<PixKeyClaimModel>(
      pixKeyClaim,
      { transaction: this.transaction },
    );

    pixKeyClaim.createdAt = createdPixKey.createdAt;
    pixKeyClaim.updatedAt = createdPixKey.updatedAt;
    return pixKeyClaim;
  }

  async update(pixKeyClaim: PixKeyClaim): Promise<PixKeyClaim> {
    await PixKeyClaimModel.update<PixKeyClaimModel>(pixKeyClaim, {
      where: { id: pixKeyClaim.id },
      transaction: this.transaction,
    });

    return pixKeyClaim;
  }

  async getById(id: string): Promise<PixKeyClaim> {
    return PixKeyClaimModel.findOne<PixKeyClaimModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixKeyClaimDatabaseRepository.toDomain);
  }

  async getByIdAndLessOpeningDate(
    id: string,
    openingDate: Date,
  ): Promise<PixKeyClaim> {
    return PixKeyClaimModel.findOne<PixKeyClaimModel>({
      where: {
        id,
        claimOpeningDate: { [Op.lt]: openingDate },
      },
      transaction: this.transaction,
    }).then(PixKeyClaimDatabaseRepository.toDomain);
  }
}
