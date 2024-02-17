import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { ExchangeContract, ExchangeContractRepository } from '@zro/otc/domain';
import { ExchangeContractNotFoundException } from '@zro/otc/application';

export type UpdatedExchangeContractParams = {
  contractNumber: string;
  vetQuote: number;
};

export class UpdateExchangeContractUseCase {
  private logger: Logger;
  constructor(
    logger: Logger,
    private exchangeContractRepository: ExchangeContractRepository,
  ) {
    this.logger = logger.child({ context: UpdateExchangeContractUseCase.name });
  }

  /**
   * Update exchange contract props.
   *
   * @param id Exchange contract uuid.
   * @returns {ExchangeContract} the updated Exchange Contract.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    updatedParams: UpdatedExchangeContractParams,
  ): Promise<ExchangeContract> {
    const { contractNumber, vetQuote } = updatedParams;

    if (!id || !contractNumber || !vetQuote) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!contractNumber ? ['ContractNumber'] : []),
        ...(!vetQuote ? ['VetQuote'] : []),
      ]);
    }

    const existingExchangeContract =
      await this.exchangeContractRepository.getById(id);

    this.logger.debug('Exchange contract found.', { existingExchangeContract });

    if (!existingExchangeContract) {
      throw new ExchangeContractNotFoundException({ id });
    }

    const updatedExchangeContract =
      await this.exchangeContractRepository.update({
        ...existingExchangeContract,
        contractNumber,
        vetQuote,
      });

    this.logger.debug('Updated exchange contract.', {
      exchangeContract: updatedExchangeContract,
    });

    return updatedExchangeContract;
  }
}
