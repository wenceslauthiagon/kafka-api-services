import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import {
  PixInfractionNotFoundException,
  IssueInfractionGateway,
  UpdateInfractionStatusIssueInfractionRequest,
  PixInfractionEventEmitter,
  PixInfractionInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleCancelPendingPixInfractionReceivedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param infractionGateway Infraction gateway.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly infractionGateway: IssueInfractionGateway,
    private readonly eventEmitter: PixInfractionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCancelPendingPixInfractionReceivedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when infraction is acknowledged to cancel status.
   *
   * @param {String} id infraction Id.
   * @returns {PixInfraction} Infraction updated.
   */
  async execute(id: string): Promise<PixInfraction> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get infraction by id
    const infraction = await this.infractionRepository.getById(id);

    this.logger.debug('Infraction found.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException(infraction);
    }

    // Indepotent
    if (infraction.state === PixInfractionState.CANCEL_CONFIRMED) {
      return infraction;
    }

    // CANCEL PENDING AND ERROR states is accept.
    // ERROR state is accepted because after error observer is called again.
    if (
      ![PixInfractionState.CANCEL_PENDING, PixInfractionState.ERROR].includes(
        infraction.state,
      )
    ) {
      throw new PixInfractionInvalidStateException(infraction);
    }

    const infractionStatusUpdateRequest: UpdateInfractionStatusIssueInfractionRequest =
      {
        issueId: infraction.issueId,
        status: infraction.status,
      };

    await this.infractionGateway.updateInfractionStatus(
      infractionStatusUpdateRequest,
    );

    infraction.state = PixInfractionState.CANCEL_CONFIRMED;

    await this.infractionRepository.update(infraction);

    this.eventEmitter.cancelConfirmedInfractionReceived(infraction);

    this.logger.debug('Updated infraction with cancel state  status.', {
      infraction,
    });

    return infraction;
  }
}
