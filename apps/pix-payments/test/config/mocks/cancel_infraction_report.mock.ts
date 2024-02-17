import { v4 as uuidV4 } from 'uuid';

import {
  CancelInfractionPixInfractionPspResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';

import {
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionReport,
} from '@zro/pix-payments/domain';

export const success = (): Promise<CancelInfractionPixInfractionPspResponse> =>
  Promise.resolve({
    status: PixInfractionStatus.CANCELLED,
    reportedBy: PixInfractionReport.DEBITED_PARTICIPANT,
    infractionType: PixInfractionType.FRAUD,
    infractionId: uuidV4(),
    operationTransactionId: uuidV4(),
    reportDetails: 'details',
    creditedParticipant: '345',
    debitedParticipant: '678',
  });

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
