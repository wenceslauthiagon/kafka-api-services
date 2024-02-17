import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import { Conversion, ConversionRepository } from '@zro/otc/domain';

export class GetConversionByOperationUseCase {
  /**
   * Default constructor.
   * @param conversionRepository Conversion repository.
   */
  constructor(
    private logger: Logger,
    private readonly conversionRepository: ConversionRepository,
  ) {
    this.logger = logger.child({
      context: GetConversionByOperationUseCase.name,
    });
  }

  /**
   * Get the conversion by operation.
   *
   * @param operation conversion operation.
   * @returns Conversion found.
   */
  async execute(operation: Operation): Promise<Conversion> {
    // Data input check
    if (!operation?.id) {
      throw new MissingDataException(['Operation ID']);
    }

    // Search conversion
    const result = await this.conversionRepository.getByOperation(operation);

    this.logger.debug('Conversion found.', { result });

    return result;
  }
}
