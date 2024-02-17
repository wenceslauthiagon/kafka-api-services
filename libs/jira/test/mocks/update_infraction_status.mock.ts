import { JsonResponse } from 'jira-client';

export const success = (): Promise<JsonResponse> => Promise.resolve({});

export const invalidStatus = () => {
  const error = {
    message: 'Transition id is not valid for this issue.',
  };
  return Promise.reject(error);
};
