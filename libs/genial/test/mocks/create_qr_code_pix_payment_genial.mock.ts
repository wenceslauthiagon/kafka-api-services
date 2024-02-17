import { faker } from '@faker-js/faker';
import { GenialCreateQrCodePixPaymentResponse } from '@zro/genial';

export const success = (): Promise<{
  data: GenialCreateQrCodePixPaymentResponse;
}> => {
  const items = [
    {
      data: {
        reference: faker.datatype.string(),
        textContent: faker.datatype.string(),
      },
    },
  ];

  return Promise.resolve({ data: { data: { items } } });
};
