import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PaymentRepository,
  PixInfractionReport,
  PixInfractionTransactionType,
  PixDevolutionRepository,
  PixInfractionStatus,
  PixInfractionTransaction,
} from '@zro/pix-payments/domain';
import {
  PixInfractionEventEmitter,
  PixInfractionInvalidStateException,
  PixTransactionNotFoundException,
} from '@zro/pix-payments/application';

export class CreatePixInfractionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly eventEmitter: PixInfractionEventEmitter,
    private readonly devolutionRepository: PixDevolutionRepository,
  ) {
    this.logger = logger.child({ context: CreatePixInfractionUseCase.name });
  }

  /**
   * Create a Infraction that was created by IssueGateway.
   *
   * @param {PixInfraction} infraction create notification.
   * @returns {PixInfraction} infraction created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PaymentNotFoundException} Thrown when payment not found.
   */
  async execute(infraction: PixInfraction): Promise<PixInfraction> {
    // Data input check
    if (
      !infraction?.id ||
      !infraction?.infractionType ||
      !infraction?.operation?.id ||
      !infraction?.status ||
      !infraction?.issueId
    ) {
      throw new MissingDataException([
        ...(!infraction?.id ? ['Pix Infraction ID'] : []),
        ...(!infraction?.infractionType ? ['Infraction Type'] : []),
        ...(!infraction?.operation?.id ? ['Operation ID'] : []),
        ...(!infraction?.status ? ['Status'] : []),
        ...(!infraction?.issueId ? ['Issue ID'] : []),
      ]);
    }

    // Check if Infraction's ID is available
    const checkInfraction = await this.infractionRepository.getByIssueId(
      infraction.issueId,
    );

    this.logger.debug('Check if infraction exists.', {
      infraction: checkInfraction,
    });

    if (checkInfraction) return checkInfraction;

    //CheckStatus when receive refund
    if (infraction.status !== PixInfractionStatus.NEW) {
      throw new PixInfractionInvalidStateException({
        status: infraction.status,
      });
    }

    const payment = await this.paymentRepository.getByOperation(
      infraction.operation,
    );
    const devolution = await this.devolutionRepository.getByOperation(
      infraction.operation,
    );

    this.logger.debug('Check if payment or devolution exists.', {
      payment,
      devolution,
    });

    if (!payment && !devolution) {
      throw new PixTransactionNotFoundException({
        operation: infraction.operation,
      });
    }

    const transactionFound: PixInfractionTransaction = payment || devolution;

    const newInfraction = new PixInfractionEntity({
      id: infraction.id,
      issueId: infraction.issueId,
      status: infraction.status,
      description: infraction.description,
      infractionType: infraction.infractionType,
      transaction: transactionFound,
      transactionType: PixInfractionTransactionType.PAYMENT,
      state: PixInfractionState.NEW_CONFIRMED,
      reportBy: PixInfractionReport.DEBITED_PARTICIPANT,
    });

    await this.infractionRepository.create(newInfraction);

    this.logger.debug('Added infraction.', { newInfraction });

    this.eventEmitter.newInfraction(newInfraction);

    return newInfraction;
  }
}
