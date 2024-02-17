import { Logger } from 'winston';
import {
  OperationStreamQuotation,
  OperationStreamQuotationRepository,
} from '@zro/operations/domain';

export class HandleCreateOperationStreamQuotationEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationStreamQuotationRepository Operation Stream Quotation repository.
   */
  constructor(
    private logger: Logger,
    private readonly operationStreamQuotationRepository: OperationStreamQuotationRepository,
  ) {
    this.logger = logger.child({
      context: HandleCreateOperationStreamQuotationEventUseCase.name,
    });
  }

  async execute(
    operationStreamQuotations: OperationStreamQuotation[],
  ): Promise<OperationStreamQuotation[]> {
    // Add in operationStreamQuotationRepository
    await this.operationStreamQuotationRepository.createOrUpdate(
      operationStreamQuotations,
    );

    return operationStreamQuotations;
  }
}
