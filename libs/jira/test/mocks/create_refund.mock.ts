import { faker } from '@faker-js/faker/locale/pt_BR';
import { JiraCreateRefundResponse } from '@zro/jira';

export const success = (): Promise<JiraCreateRefundResponse> => {
  const data: JiraCreateRefundResponse = {
    id: faker.datatype.number({ min: 1, max: 9999 }).toString(),
    key: faker.datatype.number({ min: 1, max: 9999 }).toString(),
  };

  return Promise.resolve(data);
};
