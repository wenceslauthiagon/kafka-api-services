import { v4 as uuidV4 } from 'uuid';

import {
  CreateInfractionPixInfractionPspResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionReport,
} from '@zro/pix-payments/domain';

export const success = (): Promise<CreateInfractionPixInfractionPspResponse> =>
  Promise.resolve({
    status: PixInfractionStatus.OPEN,
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
