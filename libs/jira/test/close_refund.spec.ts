import * as JiraApi from 'jira-client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PixRefundStatus, PixRefundReason } from '@zro/pix-payments/domain';
import {
  CloseRefundIssueRequest,
  CloseRefundIssueResponse,
} from '@zro/pix-payments/application';
import { JiraModule, JiraPixService } from '@zro/jira';
import * as MockJiraCreateRefund from '@zro/test/jira/mocks/create_refund.mock';

describe('Jira close refund', () => {
  let module: TestingModule;
  let jiraService: JiraPixService;

  const mockJiraCloseRefund = jest.spyOn(JiraApi.prototype, 'updateIssue');

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jira.env'] }),
        JiraModule,
      ],
    }).compile();

    jiraService = module.get(JiraPixService);
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should close refund successfully', async () => {
    mockJiraCloseRefund.mockImplementationOnce(MockJiraCreateRefund.success);

    const params: CloseRefundIssueRequest = {
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      solicitationPspId: faker.datatype.uuid(),
      description: faker.datatype.string(),
      reason: PixRefundReason.FRAUD,
    };

    const result: CloseRefundIssueResponse = await jiraService
      .getIssueRefundGateway()
      .closeRefund(params);

    expect(result).toBeDefined();
    expect(result.solicitationPspId).toBe(params.solicitationPspId);
    expect(result.status).toBe(PixRefundStatus.CLOSED);
    expect(mockJiraCloseRefund).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
