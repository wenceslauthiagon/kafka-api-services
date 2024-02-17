import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  QrCodeDynamic,
  QrCodeDynamicRepository,
} from '@zro/pix-payments/domain';
import {
  PixPaymentGateway,
  QrCodeDynamicDueDateNotFoundException,
  UpdateQrCodeDynamicDueDatePixPaymentPspRequest,
} from '@zro/pix-payments/application';

export class GetQrCodeDynamicDueDateByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param pspGateway Pix payment gateway.
   */
  constructor(
    private logger: Logger,
    private readonly qrCodeDynamicRepository: QrCodeDynamicRepository,
    private readonly pspGateway: PixPaymentGateway,
  ) {
    this.logger = logger.child({
      context: GetQrCodeDynamicDueDateByIdUseCase.name,
    });
  }

  /**
   * Get the qrCodeDynamic Due Date by id.
   *
   * @param id The qrCodeDynamic id
   * @param user qrCodeDynamic's owner.
   * @param paymentDate qrCodeDynamic intended payment date.
   * @returns QrCodeDynamic found.
   * @throws {QrCodeDynamicDueDateNotFoundException} Thrown when qrCodeDynamic id was not found.
   */
  async execute(id: string, user?: User): Promise<QrCodeDynamic> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search qrCodeDynamic
    const qrCodeDynamic = await this.qrCodeDynamicRepository.getById(id);

    this.logger.debug('Found qrCodeDynamicDueDate.', {
      qrCodeDynamic: qrCodeDynamic,
    });

    if (!qrCodeDynamic || (user && user.uuid !== qrCodeDynamic.user.uuid)) {
      throw new QrCodeDynamicDueDateNotFoundException({ id });
    }

    const body: UpdateQrCodeDynamicDueDatePixPaymentPspRequest = {
      externalId: qrCodeDynamic.externalId,
      finalDocumentValue: qrCodeDynamic.documentValue,
    };

    const pspGatewayResponse =
      await this.pspGateway.updateQrCodeDynamicDueDate(body);

    this.logger.debug('Get payloadJws from PSP gateway response.', {
      response: pspGatewayResponse,
    });

    qrCodeDynamic.payloadJws = pspGatewayResponse.payloadJws;

    const updatedQrCodeDynamic =
      await this.qrCodeDynamicRepository.update(qrCodeDynamic);

    this.logger.debug('Update qrCodeDynamicDueDate.', { updatedQrCodeDynamic });

    return updatedQrCodeDynamic;
  }
}
