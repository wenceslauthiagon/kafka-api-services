import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Operation, OperationRepository } from '@zro/operations/domain';
import { OperationNotFoundException } from '@zro/operations/application';

interface SetOperationReferenceById {
  operationFirst: Operation;
  operationSecond: Operation;
}

export class SetOperationReferenceByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationRepository Operation repository.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
  ) {
    this.logger = logger.child({
      context: SetOperationReferenceByIdUseCase.name,
    });
  }

  /**
   * Set the Operation reference by id.
   *
   * @param operationIdFirst Operation id.
   * @param operationIdSecond Operation id.
   * @returns Operation found or null if not found.
   */
  async execute(
    operationIdFirst: string,
    operationIdSecond: string,
  ): Promise<SetOperationReferenceById> {
    // Data input check
    if (!operationIdFirst || !operationIdSecond) {
      throw new MissingDataException([
        ...(!operationIdFirst ? ['Operation ID First'] : []),
        ...(!operationIdSecond ? ['Operation ID Second'] : []),
      ]);
    }

    // Search operations.
    const [operationFirst, operationSecond] = await Promise.all([
      this.operationRepository.getById(operationIdFirst),
      this.operationRepository.getById(operationIdSecond),
    ]);

    this.logger.debug('Both operations found.', {
      operationFirst,
      operationSecond,
    });

    if (!operationFirst) {
      throw new OperationNotFoundException(operationIdFirst);
    }
    if (!operationSecond) {
      throw new OperationNotFoundException(operationIdSecond);
    }

    // Set reference to other operation
    operationFirst.operationRef = operationSecond;
    operationSecond.operationRef = operationFirst;

    // Update operations
    await this.operationRepository.update(operationFirst);
    await this.operationRepository.update(operationSecond);

    this.logger.debug('Operations updated.', {
      operationFirst,
      operationSecond,
    });

    return { operationFirst, operationSecond };
  }
}
