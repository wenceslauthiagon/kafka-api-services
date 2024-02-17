import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { File } from '@zro/storage/domain';
import { ExchangeContract, ExchangeContractRepository } from '@zro/otc/domain';
import { ExchangeContractNotFoundException } from '@zro/otc/application';

export class RemoveExchangeContractFileUseCase {
  constructor(
    private logger: Logger,
    private exchangeContractRepository: ExchangeContractRepository,
  ) {
    this.logger = logger.child({
      context: RemoveExchangeContractFileUseCase.name,
    });
  }

  /**
   * Remove exchange contract.
   * @param {File} file Exchange contract file uuid.
   * @returns {ExchangeContract} The updated exchange contract.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(file: File): Promise<ExchangeContract> {
    // Checking missing params
    if (!file) {
      throw new MissingDataException(['File ID']);
    }

    const exchangeContract =
      await this.exchangeContractRepository.getByFileId(file);

    this.logger.debug('Exchange contract found.', { exchangeContract });

    if (!exchangeContract) {
      throw new ExchangeContractNotFoundException({ file });
    }

    const modifiedExchangeContract = Object.assign(exchangeContract, {
      fileId: null,
      file: { id: null },
    });

    const removeExchangeContract = await this.exchangeContractRepository.update(
      modifiedExchangeContract,
    );

    this.logger.debug('Remove exchange contract file.', {
      exchangeContract: removeExchangeContract,
    });

    return removeExchangeContract;
  }
}
