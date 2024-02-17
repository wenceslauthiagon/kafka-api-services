import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Operation, OperationRepository } from '@zro/operations/domain';

export class GetOperationByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationRepository Operation repository.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
  ) {
    this.logger = logger.child({ context: GetOperationByIdUseCase.name });
  }

  /**
   * Get the Operation by id.
   *
   * @param id Operation id.
   * @returns Operation found or null if not found.
   */
  async execute(id: string): Promise<Operation> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search operation
    const result = await this.operationRepository.getById(id);

    this.logger.debug('Operation found.', { result });

    return result;
  }
}
