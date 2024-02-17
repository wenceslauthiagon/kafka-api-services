import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionCode,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionNotFoundException,
  WarningPixDevolutionInvalidStateException,
  WarningPixDevolutionEventEmitter,
  PixPaymentGateway,
  PixDepositNotFoundException,
  CreateWarningPixDevolutionPixPaymentPspRequest,
  OperationService,
  ComplianceService,
  IssueWarningTransactionGateway,
} from '@zro/pix-payments/application';
import { OperationNotFoundException } from '@zro/operations/application';

export class HandlePendingWarningPixDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param warningPixDevolutionRepository warning pix devolution repository.
   * @param depositRepository deposit repository.
   * @param pspGateway PSP gateway instance.
   * @param issueWarningTransactionGateway Issue Warning Transaction Gateway.
   * @param operationService Operation service.
   * @param complianceService Compliance service.
   * @param eventEmitter devolution event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly warningPixDevolutionRepository: WarningPixDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly pspGateway: PixPaymentGateway,
    private readonly issueWarningTransactionGateway: IssueWarningTransactionGateway,
    private readonly operationService: OperationService,
    private readonly complianceService: ComplianceService,
    private readonly eventEmitter: WarningPixDevolutionEventEmitter,
    private readonly messageUserRequestWarningPixDevolution: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingWarningPixDevolutionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when warning pix devolution is pending.
   * In warning pix devolution case, the owner is the thirdPart, and beneficiary is the zrobank client.
   *
   * @param id warningPixDevolution id.
   * @returns Devolution created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {WarningPixDevolutionNotFoundException} Thrown when warning pix devolution id was not found.
   * @throws {WarningPixDevolutionInvalidStateException} Thrown when warning pix devolution state is not pending.
   */
  async execute(id: string): Promise<WarningPixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }
    // Search devolution
    const warningPixDevolution =
      await this.warningPixDevolutionRepository.getById(id);

    this.logger.debug('Found warning pix devolution.', {
      warningPixDevolution,
    });

    if (!warningPixDevolution) {
      throw new WarningPixDevolutionNotFoundException({ id });
    }

    // Indepotent
    if (
      [
        WarningPixDevolutionState.WAITING,
        WarningPixDevolutionState.CONFIRMED,
      ].includes(warningPixDevolution.state)
    ) {
      return warningPixDevolution;
    }

    // Only PENDING OR FAILED (because retry) devolution is accept.
    if (
      ![
        WarningPixDevolutionState.PENDING,
        WarningPixDevolutionState.FAILED,
      ].includes(warningPixDevolution.state)
    ) {
      throw new WarningPixDevolutionInvalidStateException(warningPixDevolution);
    }

    // Get operation to be reverted in the end
    const operation = await this.operationService.getOperationById(
      warningPixDevolution.operation?.id,
    );

    this.logger.debug('Found operation.', { operation });

    if (!operation) {
      throw new OperationNotFoundException(warningPixDevolution.operation?.id);
    }

    // check pix deposit
    const deposit = await this.depositRepository.getByOperation(
      warningPixDevolution.operation,
    );

    this.logger.debug('Check if deposit exists.', { deposit });

    if (!deposit) {
      throw new PixDepositNotFoundException({
        operation: warningPixDevolution.operation,
      });
    }

    this.logger.debug('Preparing warning pix devolution to send to PSP.', {
      warningPixDevolution,
    });

    // create PSP devolution
    const body: CreateWarningPixDevolutionPixPaymentPspRequest = {
      devolutionId: warningPixDevolution.id,
      depositEndToEndId: deposit.endToEndId,
      depositId: deposit.id,
      amount: warningPixDevolution.amount,
      description: warningPixDevolution.description,
      devolutionCode: warningPixDevolution.devolutionCode,
    };

    this.logger.debug('Create warning pix devolution on PSP request.', {
      request: body,
    });

    const pspResult = await this.pspGateway.createWarningPixDevolution(body);

    this.logger.debug('Create warning pix devolution on PSP response.', {
      response: pspResult,
    });

    warningPixDevolution.endToEndId = pspResult.endToEndId;
    warningPixDevolution.state = WarningPixDevolutionState.WAITING;
    warningPixDevolution.externalId = pspResult.externalId;

    // Update warning pix devolution
    await this.warningPixDevolutionRepository.update(warningPixDevolution);

    if (!operation.isReverted()) {
      // Revert Operation
      await this.operationService.revertOperation(operation);
    }

    // notify compliance if user requested devolution
    if (warningPixDevolution.devolutionCode === PixDevolutionCode.ORIGINAL) {
      const warningTransaction =
        await this.complianceService.getWarningTransactionByOperation(
          warningPixDevolution.operation,
        );

      await this.issueWarningTransactionGateway.addWarningTransactionComment({
        issueId: warningTransaction.issueId,
        text: this.messageUserRequestWarningPixDevolution,
      });
    }

    // Fire WaitingDevolution
    this.eventEmitter.waitingWarningPixDevolution(warningPixDevolution);

    this.logger.debug('Updated devolution with waiting status.', {
      warningPixDevolution,
    });

    return warningPixDevolution;
  }
}
