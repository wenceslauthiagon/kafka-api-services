import { MissingDataException } from '@zro/common';
import { CryptoOrder, CryptoOrderRepository } from '@zro/otc/domain';
import { Logger } from 'winston';

export class CreateCryptoOrderUseCase {
  constructor(
    private logger: Logger,
    private cryptoOrderRepository: CryptoOrderRepository,
  ) {
    this.logger = logger.child({ context: CreateCryptoOrderUseCase.name });
  }

  async execute(cryptoOrder: CryptoOrder) {
    if (!cryptoOrder) {
      throw new MissingDataException(['Crypto order']);
    }

    this.logger.debug('Creating crypto order', { cryptoOrder });

    const { id, baseCurrency, amount, type, side, state, system } = cryptoOrder;

    if (
      !id ||
      !baseCurrency ||
      !amount ||
      !type ||
      !side ||
      !state ||
      !system
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!baseCurrency ? ['Base Currency'] : []),
        ...(!amount ? ['Amount'] : []),
        ...(!type ? ['Type'] : []),
        ...(!side ? ['Side'] : []),
        ...(!state ? ['State'] : []),
        ...(!system ? ['System'] : []),
      ]);
    }

    const foundOrder = await this.cryptoOrderRepository.getById(id);

    // Indeponent retry
    if (foundOrder) {
      return foundOrder;
    }

    const createdOrder = await this.cryptoOrderRepository.create(cryptoOrder);

    return createdOrder;
  }
}
