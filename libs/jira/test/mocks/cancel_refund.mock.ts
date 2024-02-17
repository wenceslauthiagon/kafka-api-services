import { faker } from '@faker-js/faker/locale/pt_BR';
import { JiraCancelRefundResponse } from '@zro/jira';

export const success = (): Promise<JiraCancelRefundResponse> => {
  const data: JiraCancelRefundResponse = {
    id: faker.datatype.number({ min: 1, max: 9999 }).toString(),
    key: faker.datatype.number({ min: 1, max: 9999 }).toString(),
  };

  return Promise.resolve(data);
};
