import { faker } from '@faker-js/faker';
import { GetQrCodeByIdPixPaymentPspResponse } from '@zro/pix-zro-pay/application';
import { QrCodeState } from '@zro/pix-zro-pay/domain';

export const success = (): Promise<GetQrCodeByIdPixPaymentPspResponse> =>
  Promise.resolve({
    txId: faker.datatype.uuid(),
    emv: faker.datatype.string(),
    expirationDate: faker.datatype.string(),
    state: QrCodeState.READY,
  });
