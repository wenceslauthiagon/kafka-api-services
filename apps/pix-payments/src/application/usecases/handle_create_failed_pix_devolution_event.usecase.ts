import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixDevolutionRepository,
  PixDevolution,
  PixDepositRepository,
  PixDevolutionEntity,
  PixDevolutionCode,
  PixDevolutionState,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionEventEmitter,
  PixDepositNotFoundException,
  PixDepositInvalidStateException,
} from '@zro/pix-payments/application';
import { OperationEntity } from '@zro/operations/domain';

export class HandleCreateFailedPixDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDevolutionRepository Pix Devolution Repository.
   * @param pixDepositRepository Pix Deposit Repository.
   * @param eventPixDevolutionEmitter Pix Devolution Event Emitter.
   */
  constructor(
    private logger: Logger,
    private readonly pixDevolutionRepository: PixDevolutionRepository,
    private readonly pixDepositRepository: PixDepositRepository,
    private readonly eventPixDevolutionEmitter: PixDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCreateFailedPixDevolutionEventUseCase.name,
    });
  }

  async execute(id: string, pixDepositId: string): Promise<PixDevolution> {
    // Data input check
    if (!id || !pixDepositId) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!pixDepositId ? ['Pix Deposit ID'] : []),
      ]);
    }

    // Check if devolution's ID is available
    const pixDevolution = await this.pixDevolutionRepository.getById(id);

    this.logger.debug('Check if pix devolution already exists.', {
      pixDevolution,
    });

    if (pixDevolution) {
      return pixDevolution;
    }

    // Check pix deposit
    const pixDeposit = await this.pixDepositRepository.getById(pixDepositId);

    this.logger.debug('Check if pix deposit exists.', { pixDeposit });

    if (!pixDeposit) {
      throw new PixDepositNotFoundException({ id: pixDepositId });
    }

    // Check if pix deposit is in right state
    if (pixDeposit.state !== PixDepositState.ERROR) {
      throw new PixDepositInvalidStateException({ id: pixDepositId });
    }

    pixDeposit.returnedAmount = pixDeposit.amount;

    await this.pixDepositRepository.update(pixDeposit);

    // Set pending status and fire event pending
    const newPixDevolution = new PixDevolutionEntity({
      id,
      user: pixDeposit.user,
      operation: new OperationEntity({ id: uuidV4() }),
      endToEndId: pixDeposit.endToEndId,
      deposit: pixDeposit,
      wallet: pixDeposit.wallet,
      amount: pixDeposit.amount,
      devolutionCode: PixDevolutionCode.PSP_ERROR,
      description: pixDeposit.description,
      state: PixDevolutionState.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save Devolution on database
    await this.pixDevolutionRepository.create(newPixDevolution);

    // Fire PendingDevolutionEvent
    this.eventPixDevolutionEmitter.pendingFailedPixDevolution(newPixDevolution);

    this.logger.debug('Pix devolution added.', { newPixDevolution });

    return newPixDevolution;
  }
}
