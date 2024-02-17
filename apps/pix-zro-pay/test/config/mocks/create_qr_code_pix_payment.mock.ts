import { faker } from '@faker-js/faker';
import { CreateQrCodePixPaymentPspResponse } from '@zro/pix-zro-pay/application';

export const success = (): Promise<CreateQrCodePixPaymentPspResponse> =>
  Promise.resolve({
    id: faker.datatype.uuid(),
    txId: faker.datatype.uuid(),
    emv: faker.datatype.string(),
    expirationDate: faker.datatype.string(),
  });
