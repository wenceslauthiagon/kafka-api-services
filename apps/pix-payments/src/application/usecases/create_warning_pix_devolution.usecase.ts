import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { ForbiddenException, MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDepositState,
  WarningPixDepositRepository,
  WarningPixDepositState,
  WarningPixDevolutionEntity,
  WarningPixDevolutionState,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import {
  WarningPixDepositNotFoundException,
  WarningPixDepositInvalidStateException,
  PixDepositNotFoundException,
  PixDepositInvalidStateException,
  WarningPixDevolutionAlreadyExistsException,
  WarningPixDevolutionEventEmitter,
  PixDepositEventEmitter,
} from '@zro/pix-payments/application';

export class CreateWarningPixDevolutionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositRepository pix deposit repository.
   * @param warningPixDepositRepository warning pix deposit repository.
   * @param warningPixDevolutionRepository warning pix devolution repository.
   * @param pixDepositEventEmitter pix deposit event emitter.
   * @param warningPixDevolutionEventEmitter warning pix devolution event emitter.
   */
  constructor(
    private logger: Logger,
    private pixDepositRepository: PixDepositRepository,
    private warningPixDepositRepository: WarningPixDepositRepository,
    private warningPixDevolutionRepository: WarningPixDevolutionRepository,
    private pixDepositEventEmitter: PixDepositEventEmitter,
    private warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: CreateWarningPixDevolutionUseCase.name,
    });
  }

  /**
   * Block pix deposit.
   * @param operation Operation.
   * @param user User.
   * @returns Warning Pix Devolution.
   */
  async execute(
    user: User,
    operation: Operation,
  ): Promise<WarningPixDevolution> {
    // Data input check
    if (!user?.uuid || !operation?.id) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User ID'] : []),
        ...(!operation?.id ? ['Operation ID'] : []),
      ]);
    }

    const pixDeposit =
      await this.pixDepositRepository.getByOperation(operation);

    this.logger.debug('Found pix deposit.', { pixDeposit });

    // Check if pix deposit exists
    if (!pixDeposit) {
      throw new PixDepositNotFoundException({ operation });
    }

    // Check if request user is the same as pix deposit user
    if (pixDeposit.user.uuid !== user.uuid) {
      throw new ForbiddenException();
    }

    // Check pix deposit state is valid
    if (
      ![PixDepositState.NEW, PixDepositState.WAITING].includes(pixDeposit.state)
    ) {
      throw new PixDepositInvalidStateException(pixDeposit);
    }

    //Search warning pix deposit by operation id
    const warningPixDeposit =
      await this.warningPixDepositRepository.getByOperation(operation);

    this.logger.debug('Found warning pix deposit.', { warningPixDeposit });

    //Check if warning pix deposit exists
    if (!warningPixDeposit) {
      throw new WarningPixDepositNotFoundException({ operation });
    }

    //Check if warning pix deposit is created
    if (warningPixDeposit.state !== WarningPixDepositState.CREATED) {
      throw new WarningPixDepositInvalidStateException(warningPixDeposit);
    }

    //Search warning pix devolution by operation id
    const warningPixDevolution =
      await this.warningPixDevolutionRepository.getByOperation(operation);

    this.logger.debug('Found warning pix devolution.', {
      warningPixDevolution,
    });

    //Check if warning pix devolution exists
    if (warningPixDevolution) {
      throw new WarningPixDevolutionAlreadyExistsException(
        warningPixDevolution,
      );
    }

    //Update Pix Deposit Repository with state blocked
    pixDeposit.state = PixDepositState.BLOCKED;

    await this.pixDepositRepository.update(pixDeposit);

    //Fire blocked pix deposit event
    this.pixDepositEventEmitter.blockedDeposit(pixDeposit);

    const newWarningPixDevolution = new WarningPixDevolutionEntity({
      id: uuidV4(),
      state: WarningPixDevolutionState.PENDING,
    });

    // Fire CreateWarningPixDevolutionEvent
    this.warningPixDevolutionEventEmitter.createWarningPixDevolution({
      ...newWarningPixDevolution,
      warningPixDeposit,
    });

    return newWarningPixDevolution;
  }
}
