import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  WarningPixDevolution,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export class GetWarningPixDevolutionByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository WarningPixDevolution repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: WarningPixDevolutionRepository,
  ) {
    this.logger = logger.child({
      context: GetWarningPixDevolutionByIdUseCase.name,
    });
  }

  /**
   * Get WarningPixDevolution by id.
   *
   * @param id WarningPixDevolution id.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns WarningPixDevolution data.
   */
  async execute(id: string, user?: User): Promise<WarningPixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get WarningPixDevolution
    const warningDevolution = await this.repository.getById(id);

    this.logger.debug('WarningPixDevolution found.', { warningDevolution });

    if (
      !warningDevolution ||
      (user && user?.uuid !== warningDevolution.user.uuid)
    ) {
      return null;
    }

    return warningDevolution;
  }
}
