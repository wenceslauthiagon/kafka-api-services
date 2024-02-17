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
  PixInfractionGateway,
  PixInfractionInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleClosePendingPixInfractionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param pixInfractionGateway Pix infraction gateway.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly pixInfractionGateway: PixInfractionGateway,
    private readonly eventEmitter: PixInfractionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleClosePendingPixInfractionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when infraction is close pending to close confirmed state.
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
    if (infraction.state === PixInfractionState.CLOSED_CONFIRMED) {
      return infraction;
    }

    // CLOSED PENDING AND ERROR states is accept.
    // ERROR state is accepted because after error observer is called again.
    if (
      ![PixInfractionState.CLOSED_PENDING, PixInfractionState.ERROR].includes(
        infraction.state,
      )
    ) {
      throw new PixInfractionInvalidStateException(infraction);
    }

    infraction.status = PixInfractionStatus.CLOSED;
    infraction.state = PixInfractionState.CLOSED_CONFIRMED;

    const pspResult = await this.pixInfractionGateway.closeInfraction({
      infractionId: infraction.infractionPspId,
      analysisResult: infraction.analysisResult,
      analysisDetails: infraction.analysisDetails,
    });

    this.logger.debug('Infraction close sent to pspGateway.', { pspResult });

    await this.infractionRepository.update(infraction);

    this.eventEmitter.closedConfirmedInfraction(infraction);

    this.logger.debug(
      'Updated infraction with confirmed state and closed status.',
      {
        infraction,
      },
    );

    return infraction;
  }
}
