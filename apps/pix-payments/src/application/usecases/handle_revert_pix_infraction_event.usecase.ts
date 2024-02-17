import { Logger } from 'winston';
import { Failed, MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import {
  PixInfractionNotFoundException,
  PixInfractionEventEmitter,
} from '@zro/pix-payments/application';

export class HandleRevertPixInfractionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixInfractionRepository repository.
   * @param eventEmitter PixInfraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixInfractionRepository,
    private readonly eventEmitter: PixInfractionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleRevertPixInfractionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an revert infraction is thrown.
   *
   * @param {String} id PixInfraction id.
   * @returns {PixInfraction} PixInfraction updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixInfractionNotFoundException} Thrown when infraction id was not found.
   */
  async execute(id: string, failed?: Failed): Promise<PixInfraction> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search Pix Infraction
    const infraction = await this.repository.getById(id);

    this.logger.debug('Found Pix Infraction.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException({ id });
    }

    // Check indepotent
    if (infraction.state === PixInfractionState.ERROR) {
      return infraction;
    }

    // Update infraction
    infraction.failed = failed;
    infraction.state = PixInfractionState.ERROR;

    await this.repository.update(infraction);
    this.eventEmitter.errorInfraction(infraction);

    return infraction;
  }
}
