import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  PixDeposit,
  PixDepositRepository,
  PixDepositState,
  WarningPixDepositRepository,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  PixDepositNotFoundException,
  WarningPixDepositNotFoundException,
  PixDepositEventEmitter,
  WarningPixDepositInvalidStateException,
  PixDepositReceivedInvalidStateException,
} from '@zro/pix-payments/application';
import { OperationNotFoundException } from '@zro/operations/application';

export class ApprovePixDepositUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositRepository pix deposit repository.
   * @param warningPixDepositRepository warning pix deposit repository
   * @param operationService operation Service.
   * @param pixDepositEventEmitter pix deposit event emmiter.
   */
  constructor(
    private logger: Logger,
    private pixDepositRepository: PixDepositRepository,
    private warningPixDepositRepository: WarningPixDepositRepository,
    private operationService: OperationService,
    private pixDepositEventEmitter: PixDepositEventEmitter,
  ) {
    this.logger = logger.child({ context: ApprovePixDepositUseCase.name });
  }

  /**
   * Approve pix deposit.
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

    this.logger.debug('Found operation.', { operation });

    // check if operation exists
    if (!operation) {
      throw new OperationNotFoundException(pixDeposit.operation.id);
    }

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

    // Idempotence check.
    if (foundPixDeposit.state === PixDepositState.RECEIVED) {
      throw new PixDepositReceivedInvalidStateException(foundPixDeposit);
    }

    // Idempotence check.
    if (warningPixDeposit.state === WarningPixDepositState.REJECTED) {
      throw new WarningPixDepositInvalidStateException(warningPixDeposit);
    }

    // Accept operation
    await this.operationService.acceptOperation(operation);

    // Update Pix Deposit Repository with state received
    foundPixDeposit.state = PixDepositState.RECEIVED;

    await this.pixDepositRepository.update(foundPixDeposit);

    // Fire received pix deposit event
    this.pixDepositEventEmitter.receivedDeposit({
      ...foundPixDeposit,
      refundOperationId: uuidV4(),
    });

    // Update Warning Pix Deposit Repository with state rejected
    warningPixDeposit.state = WarningPixDepositState.REJECTED;

    await this.warningPixDepositRepository.update(warningPixDeposit);

    return foundPixDeposit;
  }
}
