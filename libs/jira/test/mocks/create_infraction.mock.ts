import { faker } from '@faker-js/faker/locale/pt_BR';
import { JiraCreateInfractionResponse } from '@zro/jira';

export const success = (): Promise<JiraCreateInfractionResponse> => {
  const data: JiraCreateInfractionResponse = {
    id: faker.datatype.number({ min: 1, max: 9999 }).toString(),
    key: faker.datatype.number({ min: 1, max: 9999 }).toString(),
  };

  return Promise.resolve(data);
};
