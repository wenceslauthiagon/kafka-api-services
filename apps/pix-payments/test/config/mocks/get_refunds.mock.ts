import { v4 as uuidV4 } from 'uuid';
import { PixRefundReason, PixRefundStatus } from '@zro/pix-payments/domain';
import {
  InvalidGetRefundNotFoundPixPaymentPspException,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';

export const success = () => {
  return Promise.resolve([
    {
      transactionId: uuidV4(),
      contested: false,
      endToEndId: 'E262642202023031411561AAAAAasda',
      refundAmount: 12.18,
      refundDetails:
        'Teste de fechamento de refunds (Refund Interna). Para mais informação: teste@teste.com.br',
      refundReason: PixRefundReason.OPERATIONAL_FLAW,
      refundType: 'REQUESTING',
      requesterIspb: '26264220',
      responderIspb: '07679404',
      status: PixRefundStatus.OPEN,
      creationDate: new Date(),
      devolutionId: '',
      infractionId: '',
      lastChangeDate: new Date(),
      solicitationId: uuidV4(),
      isInternalRefund: true,
    },
  ]);
};

export const failedNotfound =
  (): Promise<InvalidGetRefundNotFoundPixPaymentPspException> => {
    const error = 'Refund not found';
    return Promise.reject(
      new InvalidGetRefundNotFoundPixPaymentPspException(error),
    );
  };

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
