import { MissingDataException } from '@zro/common';
import { CryptoOrder, CryptoOrderRepository } from '@zro/otc/domain';
import { Logger } from 'winston';

export class GetCryptoOrderByIdUseCase {
  constructor(
    private logger: Logger,
    private cryptoOrderRepository: CryptoOrderRepository,
  ) {
    this.logger = logger.child({
      context: GetCryptoOrderByIdUseCase.name,
    });
  }

  async execute(id: CryptoOrder['id']) {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    this.logger.debug('Getting crypto order', { id });

    const foundOrder = await this.cryptoOrderRepository.getById(id);

    return foundOrder;
  }
}
