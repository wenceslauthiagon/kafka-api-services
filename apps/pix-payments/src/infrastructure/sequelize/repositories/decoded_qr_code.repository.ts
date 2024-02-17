import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  DecodedQrCode,
  DecodedQrCodeRepository,
} from '@zro/pix-payments/domain';
import { DecodedQrCodeModel } from '@zro/pix-payments/infrastructure';

export class DecodedQrCodeDatabaseRepository
  extends DatabaseRepository
  implements DecodedQrCodeRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(decodedQrCodeModel: DecodedQrCodeModel): DecodedQrCode {
    return decodedQrCodeModel?.toDomain() ?? null;
  }

  async create(decodedQrCode: DecodedQrCode): Promise<DecodedQrCode> {
    const createdDecodedQrCode =
      await DecodedQrCodeModel.create<DecodedQrCodeModel>(decodedQrCode, {
        transaction: this.transaction,
      });

    decodedQrCode.createdAt = createdDecodedQrCode.createdAt;

    return decodedQrCode;
  }

  async update(decodedQrCode: DecodedQrCode): Promise<DecodedQrCode> {
    await DecodedQrCodeModel.update<DecodedQrCodeModel>(decodedQrCode, {
      where: { id: decodedQrCode.id },
      transaction: this.transaction,
    });

    return decodedQrCode;
  }

  async getById(id: string): Promise<DecodedQrCode> {
    return DecodedQrCodeModel.findOne<DecodedQrCodeModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(DecodedQrCodeDatabaseRepository.toDomain);
  }
}
