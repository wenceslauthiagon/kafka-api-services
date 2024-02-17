import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { File } from '@zro/storage/domain';
import { ExchangeContract, ExchangeContractRepository } from '@zro/otc/domain';
import { ExchangeContractNotFoundException } from '@zro/otc/application';

export class UploadExchangeContractFileUseCase {
  constructor(
    private logger: Logger,
    private exchangeContractRepository: ExchangeContractRepository,
  ) {
    this.logger = logger.child({
      context: UploadExchangeContractFileUseCase.name,
    });
  }

  /**
   * Update exchange contract props.
   * @param id Exchange contract uuid.
   * @param file {File} File to upload.
   * @returns {ExchangeContract} the updated exchange contract.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string, file: File): Promise<ExchangeContract> {
    // Checking missing params
    if (!id || !file?.id) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!file?.id ? ['File ID'] : []),
      ]);
    }

    const exchangeContractFound =
      await this.exchangeContractRepository.getById(id);

    this.logger.debug('Exchange contract found.', { exchangeContractFound });

    if (!exchangeContractFound) {
      throw new ExchangeContractNotFoundException({ id });
    }

    const uploadExchangeContract = await this.exchangeContractRepository.update(
      { ...exchangeContractFound, file },
    );

    this.logger.debug('Updated exchange contract file.', {
      exchangeContract: uploadExchangeContract,
    });

    return uploadExchangeContract;
  }
}
