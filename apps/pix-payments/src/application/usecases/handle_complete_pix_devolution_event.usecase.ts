import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionNotFoundException,
  PixDevolutionInvalidStateException,
  OperationService,
  PixDevolutionEventEmitter,
  PixDepositNotFoundException,
  PixDevolutionWithoutPixDepositException,
} from '@zro/pix-payments/application';

export class HandleCompletePixDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixDevolution repository.
   * @param eventEmitter PixDevolution event emitter.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixDevolutionRepository,
    private readonly eventEmitter: PixDevolutionEventEmitter,
    private readonly operationService: OperationService,
    private readonly depositRepository: PixDepositRepository,
    private readonly pixSendDevolutionOperationTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleCompletePixDevolutionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when pixDevolution is complete.
   *
   * @param id PixDevolution id.
   * @param endToEndId PixDevolution endToEndId.
   * @returns PixDevolution created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixDevolutionNotFoundException} Thrown when pixDevolution id was not found.
   * @throws {PixDevolutionInvalidStateException} Thrown when pixDevolution state is not complete.
   */
  async execute(id: string, endToEndId?: string): Promise<PixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search pixDevolution
    const pixDevolution = await this.repository.getById(id);

    this.logger.debug('Found pixDevolution.', { pixDevolution });

    if (!pixDevolution) {
      throw new PixDevolutionNotFoundException({ id });
    }

    // Indepotent
    if (pixDevolution.state === PixDevolutionState.CONFIRMED) {
      return pixDevolution;
    }

    // Only WAITING pixDevolution is accept.
    if (pixDevolution.state !== PixDevolutionState.WAITING) {
      throw new PixDevolutionInvalidStateException(pixDevolution);
    }

    const hasOperation = await this.operationService.getOperationById(
      pixDevolution.operation.id,
    );

    this.logger.debug('Found operation.', { hasOperation });

    if (hasOperation) {
      // Accept pixDevolution operation
      await this.operationService.acceptOperation(pixDevolution.operation);

      this.logger.debug('Accepted pix devolution operation.', {
        pixDevolution,
      });
    }

    // PixDevolution is confirmed.
    pixDevolution.state = PixDevolutionState.CONFIRMED;
    pixDevolution.endToEndId = endToEndId;

    if (!pixDevolution.deposit?.id) {
      throw new PixDevolutionWithoutPixDepositException(pixDevolution);
    }

    const pixDepositFound = await this.depositRepository.getById(
      pixDevolution.deposit.id,
    );

    this.logger.debug('Pix deposit found.', {
      pixDeposit: pixDepositFound,
    });

    if (!pixDepositFound) {
      throw new PixDepositNotFoundException({ id: pixDevolution.deposit.id });
    }

    pixDevolution.deposit = pixDepositFound;

    // Update pixDevolution
    await this.repository.update(pixDevolution);

    // Fire ConfirmedPixDevolution
    this.eventEmitter.confirmedDevolution({
      transactionTag: this.pixSendDevolutionOperationTransactionTag,
      ...pixDevolution,
    });

    this.logger.debug('Updated pixDevolution with confirmed status.', {
      pixDevolution,
    });

    return pixDevolution;
  }
}
