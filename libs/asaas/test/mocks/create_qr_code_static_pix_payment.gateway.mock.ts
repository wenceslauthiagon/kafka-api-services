import { faker } from '@faker-js/faker';
import { AsaasCreateQrCodeStaticPixPaymentResponse } from '@zro/asaas';

export const success = (): Promise<{
  data: AsaasCreateQrCodeStaticPixPaymentResponse;
}> => {
  const data = {
    id: faker.datatype.uuid(),
    payload: faker.datatype.string(),
    expirationDate: faker.datatype.string(),
  };

  return Promise.resolve({ data });
};
