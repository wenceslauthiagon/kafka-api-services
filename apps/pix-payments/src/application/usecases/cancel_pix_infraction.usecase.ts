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

export class CancelPixInfractionUseCase {
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
    this.logger = logger.child({ context: CancelPixInfractionUseCase.name });
  }

  /**
   * Handler triggered when is to cancel infraction that was created by IssueGateway.
   *
   * @param {Number} issueId infraction issue Id.
   * @returns {PixInfraction} Infraction updated.
   */
  async execute(issueId: number): Promise<PixInfraction> {
    // Data input check
    if (!issueId) {
      throw new MissingDataException(['ID']);
    }

    // Get infraction by id
    const infraction = await this.infractionRepository.getByIssueId(issueId);

    if (!infraction) {
      throw new PixInfractionNotFoundException({ issueId });
    }

    // Indepotent
    if (
      infraction.state === PixInfractionState.CANCEL_PENDING ||
      infraction.state === PixInfractionState.CANCEL_CONFIRMED
    ) {
      return infraction;
    }

    this.logger.debug('Infraction found.', { infraction });

    infraction.status = PixInfractionStatus.CANCELLED;
    infraction.state = PixInfractionState.CANCEL_PENDING;

    await this.infractionRepository.update(infraction);

    this.eventEmitter.cancelPendingInfraction(infraction);

    this.logger.debug(
      'Updated infraction with cancelled state and pending closed status.',
      { infraction },
    );

    return infraction;
  }
}
