import { faker } from '@faker-js/faker/locale/pt_BR';
import { JiraCreateUserWithdrawSettingRequestResponse } from '@zro/jira';

export const success =
  (): Promise<JiraCreateUserWithdrawSettingRequestResponse> => {
    const data: JiraCreateUserWithdrawSettingRequestResponse = {
      id: faker.datatype.number({ min: 1, max: 99999 }).toString(),
      key: faker.datatype.number({ min: 1, max: 99999 }).toString(),
    };

    return Promise.resolve(data);
  };
