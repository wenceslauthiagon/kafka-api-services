import { MissingDataException } from '@zro/common';
import { CryptoRemittance, CryptoRemittanceRepository } from '@zro/otc/domain';
import { Logger } from 'winston';
import { CryptoRemittanceNotFoundException } from '@zro/otc/application';

export class UpdateCryptoRemittanceUseCase {
  constructor(
    private logger: Logger,
    private cryptoRemittanceRepository: CryptoRemittanceRepository,
  ) {
    this.logger = logger.child({ context: UpdateCryptoRemittanceUseCase.name });
  }

  async execute(cryptoRemittance: CryptoRemittance) {
    if (!cryptoRemittance) {
      throw new MissingDataException(['Crypto remittance']);
    }

    this.logger.debug('Updating crypto remittance', { cryptoRemittance });

    const { id } = cryptoRemittance;

    if (!id) {
      throw new MissingDataException(['ID']);
    }

    const foundRemittance = await this.cryptoRemittanceRepository.getById(id);

    if (!foundRemittance) {
      throw new CryptoRemittanceNotFoundException(cryptoRemittance);
    }

    Object.assign(foundRemittance, cryptoRemittance);

    const updatedRemittance =
      await this.cryptoRemittanceRepository.update(cryptoRemittance);

    return updatedRemittance;
  }
}
