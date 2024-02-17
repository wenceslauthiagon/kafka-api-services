import * as JiraApi from 'jira-client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PixRefundReason } from '@zro/pix-payments/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  CreateRefundIssueRequest,
  CreateRefundIssueResponse,
} from '@zro/pix-payments/application';
import { JiraModule, JiraPixService } from '@zro/jira';
import * as MockJiraCreateRefund from '@zro/test/jira/mocks/create_refund.mock';

describe('Jira create refund', () => {
  let module: TestingModule;
  let jiraService: JiraPixService;

  const mockJiraCreateRefund = jest.spyOn(JiraApi.prototype, 'addNewIssue');

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

  it('TC0001 - Should create refund successfully', async () => {
    mockJiraCreateRefund.mockImplementationOnce(MockJiraCreateRefund.success);

    const params: CreateRefundIssueRequest = {
      clientName: faker.datatype.string(),
      endToEndId: faker.datatype.string(),
      amount: 1000,
      description: faker.datatype.string(),
      reason: PixRefundReason.FRAUD,
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
    };

    const result: CreateRefundIssueResponse = await jiraService
      .getIssueRefundGateway()
      .createRefund(params);

    expect(result).toBeDefined();
    expect(result.issueId).toBeDefined();
    expect(mockJiraCreateRefund).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
