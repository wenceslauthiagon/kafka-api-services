import { QrCodeState } from '@zro/pix-zro-pay/domain';
import { ZroBankCreateQrCodePixPaymentResponse } from '@zro/zrobank';
import { v4 as uuidV4 } from 'uuid';

export const success = (): Promise<{
  data: ZroBankCreateQrCodePixPaymentResponse;
}> => {
  const data = {
    id: uuidV4(),
    txid: uuidV4(),
    emv: uuidV4(),
    key_id: uuidV4(),
    state: QrCodeState.READY,
    description: uuidV4(),
    expiration_date: new Date(),
  };

  return Promise.resolve({ data: { data } });
};
