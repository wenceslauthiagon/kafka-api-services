import { PixInfractionStatus } from '@zro/pix-payments/domain';
import { v4 as uuidV4 } from 'uuid';

export const success = (status: PixInfractionStatus) => {
  return Promise.resolve([
    {
      infractionId: uuidV4(),
      infractionType: 'FRAUD',
      isReporter: true,
      ispb: '26264220',
      operationTransactionId: uuidV4(),
      reportDetails: '',
      analysisDetails: null,
      analysisResult: null,
      cancellationDate: null,
      closingDate: null,
      creationDate: new Date(),
      creditedParticipant: '99999008',
      debitedParticipant: '26264220',
      endToEndId: 'E26264220202202222026BNJnZ2G4Xci',
      lastChangeDate: new Date(),
      reportedBy: 'DEBITED_PARTICIPANT',
      status,
    },
  ]);
};

export const notFoundInfractions = () => {
  return Promise.resolve([]);
};
