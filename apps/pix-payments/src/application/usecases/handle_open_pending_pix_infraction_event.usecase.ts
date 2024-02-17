import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PaymentRepository,
  PixDevolutionRepository,
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionTransactionType,
} from '@zro/pix-payments/domain';
import {
  PixInfractionNotFoundException,
  UpdateInfractionIssueInfractionRequest,
  IssueInfractionGateway,
  PixInfractionEventEmitter,
  PixInfractionGateway,
  PixInfractionInvalidStateException,
  PixTransactionNotFoundException,
  CreateInfractionPixInfractionPspRequest,
} from '@zro/pix-payments/application';

export class HandleOpenPendingPixInfractionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param pixPaymentGateway Pix payment gateway.
   * @param issueInfractionGateway Infraction gateway.
   * @param eventEmitter Infraction event emitter.
   * @param paymentRepository Payment repository.
   * @param devolutionRepository Devolution repository.
   */
  constructor(
    private logger: Logger,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly pixInfractionGateway: PixInfractionGateway,
    private readonly issueInfractionGateway: IssueInfractionGateway,
    private readonly eventEmitter: PixInfractionEventEmitter,
    private readonly paymentRepository: PaymentRepository,
    private readonly devolutionRepository: PixDevolutionRepository,
  ) {
    this.logger = logger.child({
      context: HandleOpenPendingPixInfractionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when infraction is updated to open status.
   *
   * @param id infraction Id.
   * @returns Infraction updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixInfractionNotFoundException} Thrown when infraction not exists.
   * @throws {PixTransactionNotFoundException} Thrown when transaction not exists.
   */
  async execute(id: string): Promise<PixInfraction> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }
    // Get infraction by id
    const infraction = await this.infractionRepository.getById(id);

    this.logger.debug('Infraction found.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException(infraction);
    }

    // Indepotent
    if (infraction.state === PixInfractionState.OPEN_CONFIRMED) {
      return infraction;
    }

    // OPEN PENDING AND ERROR states is accept.
    // ERROR state is accepted because after error observer is called again.
    if (
      ![PixInfractionState.OPEN_PENDING, PixInfractionState.ERROR].includes(
        infraction.state,
      )
    ) {
      throw new PixInfractionInvalidStateException(infraction);
    }

    const newInfraction: CreateInfractionPixInfractionPspRequest = {
      operationTransactionId: infraction.transaction.id,
      infractionType: infraction.infractionType,
      reportDetails: infraction.description,
      ispb: infraction.ispb,
      ispbCreditedParticipant: infraction.ispbCreditedParticipant,
      ispbDebitedParticipant: infraction.ispbDebitedParticipant,
      reportBy: infraction.reportBy,
      createdAt: infraction.createdAt,
      personType: null,
      document: null,
      branch: null,
      accountNumber: null,
      operationTransactionEndToEndId: null,
    };

    if (infraction.transactionType === PixInfractionTransactionType.PAYMENT) {
      const payment = await this.paymentRepository.getById(
        infraction.transaction.id,
      );

      this.logger.debug('Payment found.', { payment });

      if (!payment) {
        throw new PixTransactionNotFoundException(infraction.transaction);
      }

      infraction.transaction = payment;

      newInfraction.accountNumber = payment.beneficiaryAccountNumber;
      newInfraction.branch = payment.beneficiaryBranch;
      newInfraction.document = payment.beneficiaryDocument;
      newInfraction.personType = payment.beneficiaryPersonType;
    } else {
      const devolution = await this.devolutionRepository.getWithDepositById(
        infraction.transaction.id,
      );

      this.logger.debug('Devolution found with deposit data.', { devolution });

      if (!devolution?.deposit) {
        throw new PixTransactionNotFoundException(infraction.transaction);
      }

      infraction.transaction = devolution;

      newInfraction.accountNumber = devolution.deposit.thirdPartAccountNumber;
      newInfraction.branch = devolution.deposit.thirdPartBranch;
      newInfraction.document = devolution.deposit.thirdPartDocument;
      newInfraction.personType = devolution.deposit.getDocumentType();
    }

    newInfraction.operationTransactionEndToEndId =
      infraction.transaction.endToEndId;

    const pspResult =
      await this.pixInfractionGateway.createInfraction(newInfraction);

    this.logger.debug('Infraction sent to pspGateway.', { pspResult });

    infraction.infractionPspId = pspResult.infractionId;
    infraction.ispbDebitedParticipant = pspResult.debitedParticipant;
    infraction.ispbCreditedParticipant = pspResult.creditedParticipant;

    const infractionUpdateRequest: UpdateInfractionIssueInfractionRequest = {
      issueId: infraction.issueId,
      infractionPspId: infraction.infractionPspId,
      ispbDebitedParticipant: infraction.ispbDebitedParticipant,
      ispbCreditedParticipant: infraction.ispbCreditedParticipant,
      reportBy: infraction.reportBy,
      endToEndId: infraction.transaction.endToEndId,
    };

    await this.issueInfractionGateway.updateInfraction(infractionUpdateRequest);

    infraction.status = PixInfractionStatus.OPENED;
    infraction.state = PixInfractionState.OPEN_CONFIRMED;

    await this.infractionRepository.update(infraction);

    this.eventEmitter.openConfirmedInfraction(infraction);

    this.logger.debug(
      'Updated infraction with confirmed state and open status.',
      { infraction },
    );

    return infraction;
  }
}
