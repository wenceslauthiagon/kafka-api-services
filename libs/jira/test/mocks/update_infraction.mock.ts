import { IssueObject, JsonResponse } from 'jira-client';

export const success = (
  issueId: string,
  issueUpdate: IssueObject,
): Promise<JsonResponse> => Promise.resolve({ issueId, ...issueUpdate });
