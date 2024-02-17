import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  QrCodeDynamic,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  PixPaymentGateway,
  QrCodeDynamicNotFoundException,
  QrCodeDynamicEventEmitter,
  CreateQrCodeDynamicPixPaymentPspRequest,
  CreateQrCodeDynamicDueDatePixPaymentPspRequest,
} from '@zro/pix-payments/application';

export class HandlePendingQrCodeDynamicEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository qrCodeDynamic repository.
   * @param pspGateway PSP gateway instance.
   * @param eventEmitter QrCodeDynamic event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: QrCodeDynamicRepository,
    private readonly pspGateway: PixPaymentGateway,
    private readonly eventEmitter: QrCodeDynamicEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePendingQrCodeDynamicEventUseCase.name,
    });
  }

  /**
   * Handler triggered when qrCodeDynamic is pending.
   *
   * @param id qrCodeDynamic id.
   * @returns QrCodeDynamic created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {QrCodeDynamicNotFoundException} Thrown when qrCodeDynamic id was not found.
   */
  async execute(id: string): Promise<QrCodeDynamic> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search qrCodeDynamic
    const qrCodeDynamic = await this.repository.getById(id);

    this.logger.debug('Found QrCodeDynamic.', { qrCodeDynamic });

    if (!qrCodeDynamic) {
      throw new QrCodeDynamicNotFoundException({ id });
    }

    // Check indepotent
    if (qrCodeDynamic.state === PixQrCodeDynamicState.READY) {
      return qrCodeDynamic;
    }

    if (qrCodeDynamic.dueDate) {
      const body: CreateQrCodeDynamicDueDatePixPaymentPspRequest = {
        key: qrCodeDynamic.pixKey.key,
        qrCodeDynamicId: qrCodeDynamic.id,
        txId: qrCodeDynamic.txId,
        documentValue: qrCodeDynamic.documentValue,
        description: qrCodeDynamic.description,
        recipientCity: qrCodeDynamic.recipientCity,
        recipientName: qrCodeDynamic.recipientName,
        recipientAddress: qrCodeDynamic.recipientAddress,
        recipientZipCode: qrCodeDynamic.recipientZipCode,
        recipientFeredativeUnit: qrCodeDynamic.recipientFeredativeUnit,
        recipientDocument: qrCodeDynamic.recipientDocument,
        recipientPersonType: qrCodeDynamic.recipientPersonType,
        dueDate: qrCodeDynamic.dueDate,
        expirationDate: qrCodeDynamic.expirationDate,
        valueModifiable: qrCodeDynamic.allowUpdate,
        allowUpdateChange: qrCodeDynamic.allowUpdateChange,
        allowUpdateWithdrawal: qrCodeDynamic.allowUpdateWithdrawal,
        payerCity: qrCodeDynamic.payerCity,
        payerPersonType: qrCodeDynamic.payerPersonType,
        payerDocument: qrCodeDynamic.payerDocument,
        payerName: qrCodeDynamic.payerName,
        payerEmail: qrCodeDynamic.payerEmail,
        payerPhone: qrCodeDynamic.payerPhone,
        payerAddress: qrCodeDynamic.payerAddress,
      };

      const addedQrCodeDynamicDueDate =
        await this.pspGateway.createQrCodeDynamicDueDate(body);

      this.logger.debug('Added createQrCodeDynamicDueDate.', {
        qrCodeDynamic: addedQrCodeDynamicDueDate,
      });

      // qrCodeDynamic is ready to be used.
      qrCodeDynamic.state = PixQrCodeDynamicState.READY;
      qrCodeDynamic.emv = addedQrCodeDynamicDueDate.emv;
      qrCodeDynamic.paymentLinkUrl = addedQrCodeDynamicDueDate.paymentLinkUrl;
      qrCodeDynamic.externalId = addedQrCodeDynamicDueDate.externalId;
      qrCodeDynamic.payloadJws = addedQrCodeDynamicDueDate.payloadJws;
    } else {
      const body: CreateQrCodeDynamicPixPaymentPspRequest = {
        key: qrCodeDynamic.pixKey.key,
        qrCodeDynamicId: qrCodeDynamic.id,
        txId: qrCodeDynamic.txId,
        documentValue: qrCodeDynamic.documentValue,
        description: qrCodeDynamic.description,
        recipientCity: qrCodeDynamic.recipientCity,
        recipientName: qrCodeDynamic.recipientName,
        payerEmail: qrCodeDynamic.payerEmail,
        payerCity: qrCodeDynamic.payerCity,
        payerAddress: qrCodeDynamic.payerAddress,
        payerPersonType: qrCodeDynamic.payerPersonType,
        payerDocument: qrCodeDynamic.payerDocument,
        payerPhone: qrCodeDynamic.payerPhone,
        valueModifiable: qrCodeDynamic.allowUpdate,
        allowUpdateChange: qrCodeDynamic.allowUpdateChange,
        allowUpdateWithdrawal: qrCodeDynamic.allowUpdateWithdrawal,
        expirationDate: qrCodeDynamic.expirationDate,
      };

      const addedQrCodeDynamic =
        await this.pspGateway.createQrCodeDynamic(body);

      this.logger.debug('Added QrCodeDynamic.', {
        qrCodeDynamic: addedQrCodeDynamic,
      });

      // qrCodeDynamic is ready to be used.
      qrCodeDynamic.state = PixQrCodeDynamicState.READY;
      qrCodeDynamic.emv = addedQrCodeDynamic.emv;
      qrCodeDynamic.paymentLinkUrl = addedQrCodeDynamic.paymentLinkUrl;
      qrCodeDynamic.externalId = addedQrCodeDynamic.externalId;
      qrCodeDynamic.payloadJws = addedQrCodeDynamic.payloadJws;
    }

    // Update qrCodeDynamic
    await this.repository.update(qrCodeDynamic);

    // Fire ReadyQrCodeDynamicEvent
    this.eventEmitter.readyQrCodeDynamic(qrCodeDynamic);

    this.logger.debug('Added ready QrCodeDynamic.', { qrCodeDynamic });

    return qrCodeDynamic;
  }
}
