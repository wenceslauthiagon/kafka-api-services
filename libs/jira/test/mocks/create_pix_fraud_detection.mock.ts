import { faker } from '@faker-js/faker/locale/pt_BR';
import { JiraCreatePixFraudDetectionResponse } from '@zro/jira';

export const success = (): Promise<JiraCreatePixFraudDetectionResponse> => {
  const data: JiraCreatePixFraudDetectionResponse = {
    id: faker.datatype.number({ min: 1, max: 99999 }).toString(),
  };

  return Promise.resolve(data);
};
