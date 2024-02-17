import { DatabaseRepository } from '@zro/common';
import {
  PixKey,
  PixKeyVerification,
  PixKeyVerificationRepository,
} from '@zro/pix-keys/domain';
import { PixKeyVerificationModel } from '@zro/pix-keys/infrastructure';

export class PixKeyVerificationDatabaseRepository
  extends DatabaseRepository
  implements PixKeyVerificationRepository
{
  static toDomain(
    pixKeyVerificationModel: PixKeyVerificationModel,
  ): PixKeyVerification {
    return pixKeyVerificationModel?.toDomain() ?? null;
  }

  async create(
    pixKeyVerification: PixKeyVerification,
  ): Promise<PixKeyVerification> {
    const createdPixKeyVerification =
      await PixKeyVerificationModel.create<PixKeyVerificationModel>(
        pixKeyVerification,
        {
          transaction: this.transaction,
        },
      );

    pixKeyVerification.id = createdPixKeyVerification.id;

    return pixKeyVerification;
  }

  async countByPixKey(pixKey: PixKey): Promise<number> {
    return PixKeyVerificationModel.count<PixKeyVerificationModel>({
      where: {
        pixKeyId: pixKey.id,
      },
      transaction: this.transaction,
    });
  }

  async deleteByPixKey(pixKey: PixKey): Promise<void> {
    await PixKeyVerificationModel.destroy({
      where: {
        pixKeyId: pixKey.id,
      },
    });
  }
}
