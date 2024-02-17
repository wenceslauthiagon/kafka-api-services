import { MissingDataException } from '@zro/common';
import { CryptoRemittance, CryptoRemittanceRepository } from '@zro/otc/domain';
import { Logger } from 'winston';

export class GetCryptoRemittanceByIdUseCase {
  constructor(
    private logger: Logger,
    private cryptoRemittanceRepository: CryptoRemittanceRepository,
  ) {
    this.logger = logger.child({
      context: GetCryptoRemittanceByIdUseCase.name,
    });
  }

  async execute(id: CryptoRemittance['id']) {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    this.logger.debug('Getting crypto remittance', { id });

    const foundRemittance = await this.cryptoRemittanceRepository.getById(id);

    return foundRemittance;
  }
}
