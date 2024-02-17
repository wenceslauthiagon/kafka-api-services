import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import {
  PixInfractionNotFoundException,
  PixInfractionGateway,
  PixInfractionEventEmitter,
  PixInfractionInvalidStateException,
  CancelInfractionPixInfractionPspRequest,
} from '@zro/pix-payments/application';

export class HandleCancelPendingPixInfractionEventUseCase {
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
      context: HandleCancelPendingPixInfractionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when infraction is updated to canceled status.
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

    const request: CancelInfractionPixInfractionPspRequest = {
      infractionId: infraction.infractionPspId,
    };

    this.logger.debug('Cancel infraction on pspGateway request.', {
      request,
    });

    const pspResult = await this.pixInfractionGateway.cancelInfraction(request);

    this.logger.debug('Cancel infraction on pspGateway response.', {
      response: pspResult,
    });

    infraction.state = PixInfractionState.CANCEL_CONFIRMED;

    await this.infractionRepository.update(infraction);

    this.eventEmitter.cancelConfirmedInfraction(infraction);

    this.logger.debug(
      'Updated infraction with cancel confirmed state and cancelled status.',
      { infraction },
    );

    return infraction;
  }
}
