import { JsonResponse } from 'jira-client';

export const getIssueSuccess = (): Promise<JsonResponse> =>
  Promise.resolve({
    fields: {
      status: {
        id: '10033',
      },
    },
  });

export const getIssueInvalidId = () => {
  const error = {
    message: 'Issue does not exist or you do not have permission to see it.',
  };
  return Promise.reject(error);
};

export const transitionSuccess = (): Promise<JsonResponse> =>
  Promise.resolve({});
