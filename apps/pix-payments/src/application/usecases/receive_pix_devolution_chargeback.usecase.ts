import { Logger } from 'winston';
import { Failed, MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  PixDepositNotFoundException,
  PixDevolutionNotFoundException,
  PixDevolutionEventEmitter,
  PixDevolutionInvalidStateException,
} from '@zro/pix-payments/application';

export class ReceivePixDevolutionChargebackUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionRepository PixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param eventEmitter PixDevolution event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionRepository: PixDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly eventEmitter: PixDevolutionEventEmitter,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: ReceivePixDevolutionChargebackUseCase.name,
    });
  }

  /**
   * Handler triggered when an revert is thrown.
   *
   * @param id PixDevolution id.
   * @returns PixDevolution updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixDevolutionNotFoundException} Thrown when devolution id was not found.
   */
  async execute(
    id: string,
    chargebackReason?: string,
    failed?: Failed,
  ): Promise<PixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search PixDevolution
    const devolution = await this.devolutionRepository.getById(id);

    this.logger.debug('PixDevolution found.', { devolution });

    if (!devolution) {
      throw new PixDevolutionNotFoundException({ id });
    }

    // Check indepotent
    if (devolution.state === PixDevolutionState.FAILED) {
      return devolution;
    }

    // Check sanity
    if (PixDevolutionState.WAITING !== devolution.state) {
      throw new PixDevolutionInvalidStateException(devolution);
    }

    // Search deposit
    const deposit = await this.depositRepository.getById(devolution.deposit.id);

    this.logger.debug('Deposit found.', { deposit });

    if (!deposit) {
      throw new PixDepositNotFoundException({ id: devolution.deposit.id });
    }

    // Update the pixDeposit returned amount with the devolution amount
    deposit.returnedAmount -= devolution.amount;

    // Update pixDeposit
    await this.depositRepository.update(deposit);

    // Revert Operation Client
    await this.revertOperation(devolution);

    // Update devolution
    devolution.state = PixDevolutionState.FAILED;
    devolution.chargebackReason = chargebackReason;
    devolution.failed = failed;

    await this.devolutionRepository.update(devolution);

    // Fire ErrorPixDevolutionEvent
    this.eventEmitter.failedDevolution(devolution);

    this.logger.debug('PixDevolution reverted.', { devolution });

    return devolution;
  }

  // Revert commonOperation
  private async revertOperation(devolution: PixDevolution) {
    const hasOperation = await this.operationService.getOperationById(
      devolution.operation.id,
    );

    if (hasOperation) {
      // Revert Operation Client
      await this.operationService.revertOperation(devolution.operation);

      this.logger.debug('PixDevolution reverted.', { devolution });
    } else {
      Object.assign(devolution, { operationId: null, operation: { id: null } });
    }
  }
}
