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

export class HandleAcknowledgePixInfractionEventUseCase {
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
    this.logger = logger.child({
      context: HandleAcknowledgePixInfractionEventUseCase.name,
    });
  }

  /**
   * Update the infraction state to acknowledged.
   *
   * @param {String} infractionPspId external infraction id.
   * @returns {PixInfraction} infraction updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {InfractionNotFoundException} Thrown when infraction id was not found.
   */
  async execute(infractionPspId: string): Promise<PixInfraction> {
    // Data input check
    if (!infractionPspId) {
      throw new MissingDataException(['infraction PSP ID']);
    }

    const infraction =
      await this.infractionRepository.getByInfractionPspId(infractionPspId);

    this.logger.debug('Infraction found.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException({ infractionPspId });
    }

    // Indepotent
    if (
      infraction.state === PixInfractionState.ACKNOWLEDGED_PENDING ||
      infraction.state === PixInfractionState.ACKNOWLEDGED_CONFIRMED ||
      infraction.state === PixInfractionState.RECEIVE_PENDING ||
      infraction.state === PixInfractionState.RECEIVE_CONFIRMED
    ) {
      return infraction;
    }

    infraction.status = PixInfractionStatus.ACKNOWLEDGED;
    infraction.state = PixInfractionState.ACKNOWLEDGED_PENDING;

    await this.infractionRepository.update(infraction);

    this.logger.debug(
      'Updated infraction with pending state and acknowledged status.',
      { infraction },
    );

    this.eventEmitter.acknowledgedPendingInfraction(infraction);

    return infraction;
  }
}
