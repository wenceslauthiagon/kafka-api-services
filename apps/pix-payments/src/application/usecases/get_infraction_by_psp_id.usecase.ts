import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfractionRepository,
  PixInfraction,
} from '@zro/pix-payments/domain';

export class GetPixInfractionByPspIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository Infraction repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixInfractionRepository,
  ) {
    this.logger = logger.child({
      context: GetPixInfractionByPspIdUseCase.name,
    });
  }

  /**
   * Get infraction by psp's id.
   *
   * @param id psp id.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns Infraction data.
   */
  async execute(id: string): Promise<PixInfraction> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    this.logger.debug('Get infraction by psp id.', { id });

    const infraction = await this.repository.getByInfractionPspId(id);

    this.logger.debug('Infraction found.', { infraction });

    return infraction;
  }
}
