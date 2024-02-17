import { DatabaseRepository } from '@zro/common';
import { CryptoRemittance, CryptoRemittanceRepository } from '@zro/otc/domain';
import { CryptoRemittanceModel } from '@zro/otc/infrastructure';

export class CryptoRemittanceDatabaseRepository
  extends DatabaseRepository
  implements CryptoRemittanceRepository
{
  static toDomain(model: CryptoRemittanceModel): CryptoRemittance {
    return model?.toDomain() ?? null;
  }

  async create(cryptoRemittance: CryptoRemittance): Promise<CryptoRemittance> {
    await CryptoRemittanceModel.create(cryptoRemittance, {
      transaction: this.transaction,
    });

    return cryptoRemittance;
  }

  async update(cryptoRemittance: CryptoRemittance): Promise<CryptoRemittance> {
    await CryptoRemittanceModel.update<CryptoRemittanceModel>(
      cryptoRemittance,
      {
        where: { id: cryptoRemittance.id },
        transaction: this.transaction,
      },
    );

    return cryptoRemittance;
  }

  async getById(id: string): Promise<CryptoRemittance> {
    return CryptoRemittanceModel.findOne<CryptoRemittanceModel>({
      where: { id },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(CryptoRemittanceDatabaseRepository.toDomain);
  }
}
