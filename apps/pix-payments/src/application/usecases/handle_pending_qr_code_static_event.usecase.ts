import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  PixPaymentGateway,
  QrCodeStaticNotFoundException,
  QrCodeStaticEventEmitter,
  CreateQrCodeStaticPixPaymentPspRequest,
} from '@zro/pix-payments/application';

export class HandlePendingQrCodeStaticEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository qrCodeStatic repository.
   * @param pspGateway PSP gateway instance.
   * @param eventEmitter QrCodeStatic event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: QrCodeStaticRepository,
    private readonly pspGateway: PixPaymentGateway,
    private readonly eventEmitter: QrCodeStaticEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePendingQrCodeStaticEventUseCase.name,
    });
  }

  /**
   * Handler triggered when qrCodeStatic is pending.
   *
   * @param id qrCodeStatic id.
   * @returns QrCodeStatic created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {QrCodeStaticNotFoundException} Thrown when qrCodeStatic id was not found.
   */
  async execute(id: string): Promise<QrCodeStatic> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search qrCodeStatic
    const qrCodeStatic = await this.repository.getById(id);

    this.logger.debug('Found QrCodeStatic.', { qrCodeStatic });

    if (!qrCodeStatic) {
      throw new QrCodeStaticNotFoundException({ id });
    }

    // Only PENDING qrCodeStatic can go to READY state.
    if (qrCodeStatic.state !== QrCodeStaticState.PENDING) {
      return qrCodeStatic;
    }

    const body: CreateQrCodeStaticPixPaymentPspRequest = {
      key: qrCodeStatic.pixKey.key,
      keyType: qrCodeStatic.pixKey.type,
      qrCodeStaticId: qrCodeStatic.id,
      txId: qrCodeStatic.txId,
      documentValue: qrCodeStatic.documentValue,
      recipientName: qrCodeStatic.recipientName,
      description: qrCodeStatic.description,
      recipientCity: qrCodeStatic.recipientCity,
      ispbWithdrawal: qrCodeStatic.ispbWithdrawal,
    };

    const addedQrCodeStatic = await this.pspGateway.createQrCodeStatic(body);

    this.logger.debug('Added QrCodeStatic.', {
      qrCodeStatic: addedQrCodeStatic,
    });

    // qrCodeStatic is ready to be used.
    qrCodeStatic.state = QrCodeStaticState.READY;
    qrCodeStatic.emv = addedQrCodeStatic.emv;

    // Update qrCodeStatic
    await this.repository.update(qrCodeStatic);

    // Fire ReadyQrCodeStaticEvent
    this.eventEmitter.readyQrCodeStatic(qrCodeStatic);

    this.logger.debug('Added ready QrCodeStatic.', { qrCodeStatic });

    return qrCodeStatic;
  }
}
