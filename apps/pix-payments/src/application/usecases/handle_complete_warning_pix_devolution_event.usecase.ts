import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionNotFoundException,
  WarningPixDevolutionInvalidStateException,
  WarningPixDevolutionEventEmitter,
} from '@zro/pix-payments/application';

export class HandleCompleteWarningPixDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param warningPixDevolutionRepository WarningPixDevolutionRepository repository.
   * @param eventWarningPixDevolutionEmitter WarningPixDevolutionEventEmitter event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly warningPixDevolutionRepository: WarningPixDevolutionRepository,
    private readonly eventWarningPixDevolutionEmitter: WarningPixDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCompleteWarningPixDevolutionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when warningPixDevolution is complete.
   *
   * @param id PixDevolution id.
   * @param endToEndId endToEnd id.
   * @returns WarningPixDevolution created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {WarningPixDevolutionNotFoundException} Thrown when warningPixDevolution id was not found.
   * @throws {WarningPixDevolutionInvalidStateException} Thrown when warningPixDevolution state is not complete.
   */
  async execute(
    id: string,
    endToEndId?: string,
  ): Promise<WarningPixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search pixDevolution
    const warningPixDevolution =
      await this.warningPixDevolutionRepository.getById(id);

    this.logger.debug('Found warningPixDevolution.', { warningPixDevolution });

    if (!warningPixDevolution) {
      throw new WarningPixDevolutionNotFoundException({ id });
    }

    // Indepotent
    if (warningPixDevolution.state === WarningPixDevolutionState.CONFIRMED) {
      return warningPixDevolution;
    }

    // Only WAITING state is accepted.
    if (warningPixDevolution.state !== WarningPixDevolutionState.WAITING) {
      throw new WarningPixDevolutionInvalidStateException(warningPixDevolution);
    }

    // warningPixDevolution is confirmed.
    warningPixDevolution.state = WarningPixDevolutionState.CONFIRMED;
    warningPixDevolution.endToEndId = endToEndId;

    // Update warningPixDevolution
    await this.warningPixDevolutionRepository.update(warningPixDevolution);

    // Fire ConfirmedWarningPixDevolution
    this.eventWarningPixDevolutionEmitter.confirmedWarningPixDevolution(
      warningPixDevolution,
    );

    this.logger.debug('Updated warningPixDevolution with confirmed status.', {
      warningPixDevolution,
    });

    return warningPixDevolution;
  }
}
