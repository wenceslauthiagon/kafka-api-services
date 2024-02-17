import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDepositState,
  WarningPixDepositRepository,
  WarningPixDepositState,
  PixDeposit,
  WarningPixDevolutionEntity,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  PixDepositNotFoundException,
  PixDepositEventEmitter,
  WarningPixDepositNotFoundException,
  PixDepositReceivedInvalidStateException,
  WarningPixDepositInvalidStateException,
  WarningPixDevolutionEventEmitter,
} from '@zro/pix-payments/application';
import { OperationNotFoundException } from '@zro/operations/application';

export class BlockPixDepositUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositRepository pix deposit repository.
   * @param warningPixDepositRepository warning pix deposit repository.
   * @param operationService operation Service.
   * @param pixDepositEventEmitter pix deposit event emmiter.
   * @param warningPixDevolutionEventEmitter warning pix devolution event emitter.
   */
  constructor(
    private logger: Logger,
    private pixDepositRepository: PixDepositRepository,
    private warningPixDepositRepository: WarningPixDepositRepository,
    private operationService: OperationService,
    private pixDepositEventEmitter: PixDepositEventEmitter,
    private warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitter,
  ) {
    this.logger = logger.child({ context: BlockPixDepositUseCase.name });
  }

  /**
   * Block pix deposit.
   * @param pixDeposit Pix deposit params.
   * @returns Pix deposit approved.
   */
  async execute(pixDeposit: PixDeposit): Promise<PixDeposit> {
    // Data input check
    if (!pixDeposit?.operation?.id) {
      throw new MissingDataException(['Operation ID']);
    }

    const operation = await this.operationService.getOperationById(
      pixDeposit.operation.id,
    );

    // check if operation exists
    if (!operation) {
      throw new OperationNotFoundException(pixDeposit.operation.id);
    }

    this.logger.debug('Found operation.', { operation });

    // check if pixDeposit exists
    const foundPixDeposit =
      await this.pixDepositRepository.getByOperation(operation);

    this.logger.debug('Found pix deposit.', { pixDeposit: foundPixDeposit });

    // Sanity check
    if (!foundPixDeposit) {
      throw new PixDepositNotFoundException(pixDeposit);
    }

    // Search Warning Pix Deposit by operation id
    const warningPixDeposit =
      await this.warningPixDepositRepository.getByOperation(operation);

    this.logger.debug('Found Warning Pix Deposit.', { warningPixDeposit });

    // Check if Warning Pix Deposit exists
    if (!warningPixDeposit) {
      throw new WarningPixDepositNotFoundException({ operation });
    }

    // Indepotent
    if (foundPixDeposit.state === PixDepositState.BLOCKED) {
      throw new PixDepositReceivedInvalidStateException(foundPixDeposit);
    }

    // Indepotent
    if (warningPixDeposit.state === WarningPixDepositState.APPROVED) {
      throw new WarningPixDepositInvalidStateException(warningPixDeposit);
    }

    // Update Pix Deposit Repository with state blocked
    foundPixDeposit.state = PixDepositState.BLOCKED;

    await this.pixDepositRepository.update(foundPixDeposit);

    // Fire blocked pix deposit event
    this.pixDepositEventEmitter.blockedDeposit(foundPixDeposit);

    // Update Warning Pix Deposit Repository with state approved
    warningPixDeposit.state = WarningPixDepositState.APPROVED;

    await this.warningPixDepositRepository.update(warningPixDeposit);

    const warningPixDevolution = new WarningPixDevolutionEntity({
      id: uuidV4(),
      state: WarningPixDevolutionState.PENDING,
    });

    // Fire CreateWarningPixDevolutionEvent
    this.warningPixDevolutionEventEmitter.createWarningPixDevolution({
      ...warningPixDevolution,
      warningPixDeposit,
    });

    return foundPixDeposit;
  }
}
