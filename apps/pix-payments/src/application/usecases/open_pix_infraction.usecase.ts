import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
} from '@zro/pix-payments/domain';
import {
  PixInfractionNotFoundException,
  PixInfractionEventEmitter,
} from '@zro/pix-payments/application';

export class OpenPixInfractionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly eventEmitter: PixInfractionEventEmitter,
  ) {
    this.logger = logger.child({ context: OpenPixInfractionUseCase.name });
  }

  /**
   * Open a Infraction.
   *
   * @param {id} issueId issue id.
   * @returns {PixInfraction} infraction updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {InfractionNotFoundException} Thrown when infraction id was not found.
   */
  async execute(issueId: number, description: string): Promise<PixInfraction> {
    // Data input check
    if (!issueId) {
      throw new MissingDataException(['Issue ID']);
    }

    const infraction = await this.infractionRepository.getByIssueId(issueId);

    this.logger.debug('Infraction found.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException(infraction);
    }

    // Indepotent
    if (infraction.state === PixInfractionState.OPEN_PENDING) {
      return infraction;
    }

    infraction.status = PixInfractionStatus.OPENED;
    infraction.state = PixInfractionState.OPEN_PENDING;
    infraction.description = description;

    await this.infractionRepository.update(infraction);

    this.logger.debug('Updated infraction.', { infraction });

    this.eventEmitter.openPendingInfraction(infraction);

    return infraction;
  }
}
