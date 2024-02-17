import { MissingDataException } from '@zro/common';
import { CryptoOrder, CryptoOrderRepository } from '@zro/otc/domain';
import { Logger } from 'winston';
import { CryptoOrderNotFoundException } from '@zro/otc/application';

export class UpdateCryptoOrderUseCase {
  constructor(
    private logger: Logger,
    private cryptoOrderRepository: CryptoOrderRepository,
  ) {
    this.logger = logger.child({ context: UpdateCryptoOrderUseCase.name });
  }

  async execute(cryptoOrder: CryptoOrder) {
    if (!cryptoOrder) {
      throw new MissingDataException(['Crypto order']);
    }

    this.logger.debug('Updating crypto order', { cryptoOrder });

    const { id } = cryptoOrder;

    if (!id) {
      throw new MissingDataException(['ID']);
    }

    const foundOrder = await this.cryptoOrderRepository.getById(id);

    if (!foundOrder) {
      throw new CryptoOrderNotFoundException(cryptoOrder);
    }

    Object.assign(foundOrder, cryptoOrder);

    const updatedOrder = await this.cryptoOrderRepository.update(cryptoOrder);

    return updatedOrder;
  }
}
