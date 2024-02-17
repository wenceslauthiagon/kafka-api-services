import { faker } from '@faker-js/faker/locale/pt_BR';
import { JiraUpdatePixFraudDetectionResponse } from '@zro/jira';
import { JsonResponse } from 'jira-client';

export const successExternalId =
  (): Promise<JiraUpdatePixFraudDetectionResponse> => {
    const data: JiraUpdatePixFraudDetectionResponse = {
      id: faker.datatype.number({ min: 1, max: 99999 }).toString(),
    };

    return Promise.resolve(data);
  };

export const successStatus = (): Promise<JsonResponse> => Promise.resolve({});

export const invalidStatus = () => {
  const error = {
    message: 'Transition id is not valid for this issue.',
  };
  return Promise.reject(error);
};
