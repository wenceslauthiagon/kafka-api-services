import { MissingDataException } from '@zro/common';
import { CryptoRemittance, CryptoRemittanceRepository } from '@zro/otc/domain';
import { Logger } from 'winston';

export class CreateCryptoRemittanceUseCase {
  constructor(
    private logger: Logger,
    private cryptoRemittanceRepository: CryptoRemittanceRepository,
  ) {
    this.logger = logger.child({ context: CreateCryptoRemittanceUseCase.name });
  }

  async execute(cryptoRemittance: CryptoRemittance) {
    if (!cryptoRemittance) {
      throw new MissingDataException(['Crypto remittance']);
    }

    this.logger.debug('Creating crypto remittance', { cryptoRemittance });

    const {
      id,
      baseCurrency,
      quoteCurrency,
      market,
      amount,
      type,
      side,
      status,
    } = cryptoRemittance;

    if (
      !id ||
      !baseCurrency ||
      !quoteCurrency ||
      !market ||
      !amount ||
      !type ||
      !side ||
      !status
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!baseCurrency ? ['Base Currency'] : []),
        ...(!quoteCurrency ? ['Quote Currency'] : []),
        ...(!market ? ['Market'] : []),
        ...(!amount ? ['Amount'] : []),
        ...(!type ? ['Type'] : []),
        ...(!side ? ['Side'] : []),
        ...(!status ? ['Status'] : []),
      ]);
    }

    const foundRemittance = await this.cryptoRemittanceRepository.getById(id);

    // Indeponent retry
    if (foundRemittance) {
      return foundRemittance;
    }

    const createdRemittance =
      await this.cryptoRemittanceRepository.create(cryptoRemittance);

    return createdRemittance;
  }
}
