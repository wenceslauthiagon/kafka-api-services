import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  Remittance,
  RemittanceRepository,
  RemittanceStatus,
} from '@zro/otc/domain';
import {
  RemittanceNotFoundException,
  RemittanceEventEmitter,
  RemittanceInvalidStatusException,
} from '@zro/otc/application';

export class ManuallyCloseRemittanceUseCase {
  private logger: Logger;
  constructor(
    logger: Logger,
    private readonly remittanceRepository: RemittanceRepository,
    private readonly remittanceEmitter: RemittanceEventEmitter,
  ) {
    this.logger = logger.child({
      context: ManuallyCloseRemittanceUseCase.name,
    });
  }

  /**
   * Close remittance props.
   *
   * @param id Remittance uuid.
   * @returns the closed remittance.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    bankQuote: number,
    resultAmount: number,
    status = RemittanceStatus.CLOSED_MANUALLY,
  ): Promise<Remittance> {
    if (!id || !isDefined(bankQuote) || !isDefined(resultAmount)) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!isDefined(bankQuote) ? ['BankQuote'] : []),
        ...(!isDefined(resultAmount) ? ['ResultAmount'] : []),
      ]);
    }

    const existingRemittance = await this.remittanceRepository.getById(id);

    this.logger.debug('Remittance found.', { existingRemittance });

    if (!existingRemittance) {
      throw new RemittanceNotFoundException({ id });
    }

    if (
      [RemittanceStatus.CLOSED, RemittanceStatus.CLOSED_MANUALLY].includes(
        existingRemittance.status,
      )
    ) {
      throw new RemittanceInvalidStatusException(existingRemittance);
    }

    const closedRemittance = await this.remittanceRepository.update({
      ...existingRemittance,
      bankQuote,
      resultAmount,
      status,
    });

    this.remittanceEmitter.manuallyClosedRemittance({
      ...closedRemittance,
      systemId: closedRemittance.system?.id,
    });

    this.logger.debug('Closed remittance.', {
      remittance: closedRemittance,
    });

    return closedRemittance;
  }
}
