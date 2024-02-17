import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Spread, SpreadRepository } from '@zro/otc/domain';
import { SpreadNotFoundException } from '@zro/otc/application';

export class GetSpreadByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param spreadRepository Spread repository.
   */
  constructor(
    private logger: Logger,
    private readonly spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({ context: GetSpreadByIdUseCase.name });
  }

  /**
   * Get the spread by id.
   *
   * @param {UUID} id The spread id
   * @returns {Spread} Spread found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {SpreadNotFoundException} Thrown when spread id was not found.
   */
  async execute(id: string): Promise<Spread> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search spread
    const spread = await this.spreadRepository.getById(id);

    this.logger.debug('Found spread.', { spread });

    if (!spread) {
      throw new SpreadNotFoundException({ id });
    }

    return spread;
  }
}
