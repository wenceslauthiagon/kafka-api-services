import { v4 as uuidV4 } from 'uuid';
import {
  DecodeQrCodePixPaymentPspResponse,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';
import { PersonType } from '@zro/users/domain';
import {
  AccountType,
  DecodedQrCodeType,
  PixAgentMod,
} from '@zro/pix-payments/domain';

export const success = (): Promise<DecodeQrCodePixPaymentPspResponse> => {
  return Promise.resolve({
    key: uuidV4(),
    txId: uuidV4(),
    documentValue: 222,
    additionalInfo: uuidV4(),
    recipientName: uuidV4(),
    recipientPersonType: PersonType.LEGAL_PERSON,
    recipientDocument: '11111111111',
    recipientIspb: '12345678',
    recipientBranch: '1111',
    recipientAccountType: AccountType.CACC,
    recipientAccountNumber: uuidV4(),
    recipientCity: uuidV4(),
    endToEndId: uuidV4(),
    type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
    paymentValue: 222,
    allowUpdate: true,
    pss: uuidV4(),
    agentIspbWithdrawal: '87654321',
    agentModWithdrawal: PixAgentMod.AGTOT,
    agentIspbChange: '99999008',
    agentModChange: PixAgentMod.AGTEC,
    expirationDate: new Date(),
    payerPersonType: PersonType.LEGAL_PERSON,
    payerDocument: '00000000000',
    payerName: uuidV4(),
    status: uuidV4(),
    version: uuidV4(),
    additionalInfos: [{ name: uuidV4(), value: uuidV4() }],
    withdrawValue: 222,
    changeValue: 222,
    dueDate: new Date(),
    interestValue: 222,
    fineValue: 222,
    deductionValue: 222,
    discountValue: 222,
  });
};

export const empty = (): Promise<string> => Promise.resolve('');

export const offline = (): Promise<OfflinePixPaymentPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixPaymentPspException(error));
};
