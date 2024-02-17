import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';

import {
  PixDepositRepository,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixDepositNotFoundException,
  PixDevolutionNotFoundException,
  PixDevolutionInvalidStateException,
  PixDevolutionEventEmitter,
  PixPaymentGateway,
  CreatePixDevolutionPixPaymentPspRequest,
} from '@zro/pix-payments/application';

export class HandlePendingFailedPixDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionRepository devolution repository.
   * @param depositRepository deposit repository.
   * @param pspGateway PSP gateway instance.
   * @param eventEmitter devolution event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionRepository: PixDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly pspGateway: PixPaymentGateway,
    private readonly eventEmitter: PixDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedPixDevolutionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when failed pix devolution is pending.
   * In devolution case, the owner is the thirdPart, and beneficiary is the client.
   *
   * @param id devolution id.
   * @returns Devolution created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {DevolutionNotFoundException} Thrown when devolution id was not found.
   * @throws {DevolutionInvalidStateException} Thrown when devolution state is not pending.
   */
  async execute(id: string): Promise<PixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search devolution
    const devolution = await this.devolutionRepository.getById(id);

    this.logger.debug('Found devolution.', { devolution });

    if (!devolution) {
      throw new PixDevolutionNotFoundException({ id });
    }

    // Check indepotent
    if (
      [PixDevolutionState.WAITING, PixDevolutionState.CONFIRMED].includes(
        devolution.state,
      )
    ) {
      return devolution;
    }

    // Only PENDING devolution is accept.
    if (devolution.state !== PixDevolutionState.PENDING) {
      throw new PixDevolutionInvalidStateException(devolution);
    }

    // Search deposit
    const deposit = await this.depositRepository.getById(devolution.deposit.id);

    this.logger.debug('Deposit found.', { deposit });

    if (!deposit) {
      throw new PixDepositNotFoundException({ id: devolution.deposit.id });
    }

    const body: CreatePixDevolutionPixPaymentPspRequest = {
      devolutionId: devolution.id,
      depositId: deposit.id,
      depositEndToEndId: deposit.endToEndId,
      amount: devolution.amount,
      description: devolution.description,
      devolutionCode: devolution.devolutionCode,
    };

    const pspResult = await this.pspGateway.createPixDevolution(body);

    this.logger.debug('Failed pix devolution response of pspGateway.', {
      pspResult,
    });

    devolution.endToEndId = pspResult.endToEndId;
    devolution.state = PixDevolutionState.WAITING;
    devolution.externalId = pspResult.externalId;

    // Update failed pix devolution
    await this.devolutionRepository.update(devolution);

    // Fire waiting devolution
    this.eventEmitter.waitingDevolution(devolution);

    this.logger.debug('Updated failed pix devolution with waiting status.', {
      devolution,
    });

    return devolution;
  }
}
