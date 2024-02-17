import { faker } from '@faker-js/faker/locale/pt_BR';
import { JiraCloseRefundResponse } from '@zro/jira';

export const success = (): Promise<JiraCloseRefundResponse> => {
  const data: JiraCloseRefundResponse = {
    id: faker.datatype.number({ min: 1, max: 9999 }).toString(),
    key: faker.datatype.number({ min: 1, max: 9999 }).toString(),
  };

  return Promise.resolve(data);
};
