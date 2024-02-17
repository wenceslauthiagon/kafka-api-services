import { Logger } from 'winston';
import { Failed, MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixDepositNotFoundException,
  WarningPixDevolutionNotFoundException,
  WarningPixDevolutionEventEmitter,
  WarningPixDevolutionInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleRevertWarningPixDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionRepository WarningPixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param eventEmitter WarningPixDevolution event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionRepository: WarningPixDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly eventEmitter: WarningPixDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleRevertWarningPixDevolutionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an revert is thrown.
   *
   * @param {String} id WarningPixDevolution id.
   * @returns {WarningPixDevolution} WarningPixDevolution updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {WarningPixDevolutionNotFoundException} Thrown when devolution id was not found.
   */
  async execute(
    id: string,
    chargebackReason?: string,
    failed?: Failed,
  ): Promise<WarningPixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search WarningPixDevolution
    const warningPixDevolution = await this.devolutionRepository.getById(id);

    this.logger.debug('Found WarningPixDevolution.', { warningPixDevolution });

    if (!warningPixDevolution) {
      throw new WarningPixDevolutionNotFoundException({ id });
    }

    // Check indepotent
    if (warningPixDevolution.state === WarningPixDevolutionState.FAILED) {
      return warningPixDevolution;
    }

    // Check sanity
    if (
      ![
        WarningPixDevolutionState.PENDING,
        WarningPixDevolutionState.WAITING,
        WarningPixDevolutionState.CONFIRMED,
      ].includes(warningPixDevolution.state)
    ) {
      throw new WarningPixDevolutionInvalidStateException(warningPixDevolution);
    }

    // Search deposit
    const deposit = await this.depositRepository.getByOperation(
      warningPixDevolution.operation,
    );

    this.logger.debug('Found deposit.', { deposit });

    if (!deposit) {
      throw new PixDepositNotFoundException({
        operation: warningPixDevolution.operation,
      });
    }

    // Update the pixDeposit returned amount with the warningPixDevolution amount
    deposit.returnedAmount -= warningPixDevolution.amount;

    // Update pixDeposit
    await this.depositRepository.update(deposit);

    // Update warningPixDevolution
    warningPixDevolution.state = WarningPixDevolutionState.FAILED;
    warningPixDevolution.chargebackReason = chargebackReason;
    warningPixDevolution.failed = failed;

    await this.devolutionRepository.update(warningPixDevolution);

    // Fire ErrorWarningPixDevolutionEvent
    this.eventEmitter.failedWarningPixDevolution(warningPixDevolution);

    return warningPixDevolution;
  }
}
