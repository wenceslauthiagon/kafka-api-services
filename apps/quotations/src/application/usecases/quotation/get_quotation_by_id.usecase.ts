import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Quotation, QuotationRepository } from '@zro/quotations/domain';

export class GetQuotationByIdUseCase {
  constructor(
    private logger: Logger,
    private readonly quotationRepository: QuotationRepository,
  ) {
    this.logger = logger.child({ context: GetQuotationByIdUseCase.name });
  }

  /**
   * Get quotation by id.
   * @returns The quotation.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<Quotation> {
    // Data input sanitize
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    const result = await this.quotationRepository.getById(id);

    this.logger.debug('Quotation found.', { result });

    return result;
  }
}
