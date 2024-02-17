import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  WarningPixDevolutionRepository,
  WarningPixDevolution,
  PixDepositRepository,
  WarningPixDevolutionEntity,
  PixDevolutionCode,
  WarningPixDevolutionState,
  WarningPixDepositRepository,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionEventEmitter,
  PixDepositNotFoundException,
  WarningPixDepositNotFoundException,
} from '@zro/pix-payments/application';

export class HandleCreateWarningPixDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param warningPixDevolutionRepository Warning Pix Devolution Repository.
   * @param warningPixDepositRepository Warning Pix Deposit Repository.
   * @param eventWarningPixDevolutionEmitter Warning Pix Devolution Event Emitter.
   * @param depositRepository Pix Deposit Repository.
   */
  constructor(
    private logger: Logger,
    private readonly warningPixDevolutionRepository: WarningPixDevolutionRepository,
    private readonly warningPixDepositRepository: WarningPixDepositRepository,
    private readonly eventWarningPixDevolutionEmitter: WarningPixDevolutionEventEmitter,
    private readonly depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({
      context: HandleCreateWarningPixDevolutionEventUseCase.name,
    });
  }

  async execute(
    id: string,
    warningPixDepositId: string,
  ): Promise<WarningPixDevolution> {
    // Data input check
    if (!id || !warningPixDepositId) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!warningPixDepositId ? ['Warning Pix Deposit ID'] : []),
      ]);
    }

    // Check if devolution's ID is available
    const warningPixDevolution =
      await this.warningPixDevolutionRepository.getById(id);

    this.logger.debug('Check if warning pix devolution already exists.', {
      warningPixDevolution,
    });

    if (warningPixDevolution) {
      return warningPixDevolution;
    }

    //Check warning pix deposit
    const warningPixDeposit =
      await this.warningPixDepositRepository.getById(warningPixDepositId);

    this.logger.debug('Check if warning pix deposit exists.', {
      warningPixDeposit,
    });

    if (!warningPixDeposit) {
      throw new WarningPixDepositNotFoundException({ id: warningPixDepositId });
    }

    //Check pix deposit
    const deposit = await this.depositRepository.getByOperation(
      warningPixDeposit.operation,
    );

    this.logger.debug('Check if pix deposit exists.', {
      deposit,
    });

    if (!deposit) {
      throw new PixDepositNotFoundException({
        operation: warningPixDeposit.operation,
      });
    }

    deposit.returnedAmount = deposit.amount;

    await this.depositRepository.update(deposit);

    // Check if devolution was requested by user
    const warningPixDevolutionRequestedByUser =
      WarningPixDepositState.CREATED === warningPixDeposit.state;

    // Set pending status and fire event pending
    const newWarningPixDevolution = new WarningPixDevolutionEntity({
      id,
      user: deposit.user,
      operation: deposit.operation,
      endToEndId: deposit.endToEndId,
      amount: deposit.amount,
      devolutionCode: warningPixDevolutionRequestedByUser
        ? PixDevolutionCode.ORIGINAL
        : PixDevolutionCode.FRAUD,
      description: deposit.description,
      state: WarningPixDevolutionState.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save Devolution on database
    await this.warningPixDevolutionRepository.create(newWarningPixDevolution);

    // Fire PendingDevolutionEvent
    this.eventWarningPixDevolutionEmitter.pendingWarningPixDevolution(
      newWarningPixDevolution,
    );

    this.logger.debug('Added warning pix devolution.', {
      newWarningPixDevolution,
    });

    return newWarningPixDevolution;
  }
}
