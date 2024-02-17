import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import {
  WarningPixDevolutionRepository,
  WarningPixDevolution,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export class GetWarningPixDevolutionByOperationIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param warningPixDevolutionRepository WarningPixDevolution repository.
   */
  constructor(
    private logger: Logger,
    private readonly warningPixDevolutionRepository: WarningPixDevolutionRepository,
  ) {
    this.logger = logger.child({
      context: GetWarningPixDevolutionByOperationIdUseCase.name,
    });
  }

  /**
   * Get WarningPixDevolution by operation.
   *
   * @param operation WarningPixDevolution operation.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns WarningPixDevolution data.
   */
  async execute(
    operation: Operation,
    user: User,
  ): Promise<WarningPixDevolution> {
    // Data input check
    if (!operation?.id) {
      throw new MissingDataException(['Operation']);
    }

    // Get WarningPixDevolution
    const warningPixDevolution =
      await this.warningPixDevolutionRepository.getByOperation(operation);

    this.logger.debug('WarningPixDevolution found.', { warningPixDevolution });

    if (
      !warningPixDevolution ||
      user?.uuid !== warningPixDevolution.user?.uuid
    ) {
      return null;
    }

    return warningPixDevolution;
  }
}
