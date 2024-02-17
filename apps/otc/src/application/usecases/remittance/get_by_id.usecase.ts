import { MissingDataException } from '@zro/common';
import { Remittance, RemittanceRepository } from '@zro/otc/domain';
import { Logger } from 'winston';
import { RemittanceNotFoundException } from '@zro/otc/application';

export class GetRemittanceByIdUseCase {
  constructor(
    private logger: Logger,
    private remittanceRepository: RemittanceRepository,
  ) {
    this.logger = logger.child({
      context: GetRemittanceByIdUseCase.name,
    });
  }

  async execute(id: Remittance['id']) {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    this.logger.debug('Getting remittance', { id });

    const remittance = await this.remittanceRepository.getById(id);

    this.logger.debug('Remittance found', { remittance });

    if (!remittance) {
      throw new RemittanceNotFoundException({ id });
    }

    return remittance;
  }
}
