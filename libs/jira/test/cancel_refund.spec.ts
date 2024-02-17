import * as JiraApi from 'jira-client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  PixRefundStatus,
  PixRefundRejectionReason,
} from '@zro/pix-payments/domain';
import {
  CancelRefundIssueRequest,
  CancelRefundIssueResponse,
} from '@zro/pix-payments/application';
import { JiraModule, JiraPixService } from '@zro/jira';
import * as MockJiraCreateRefund from '@zro/test/jira/mocks/create_refund.mock';

describe('Jira cancel refund', () => {
  let module: TestingModule;
  let jiraService: JiraPixService;

  const mockJiraCancelRefund = jest.spyOn(JiraApi.prototype, 'updateIssue');

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

  it('TC0001 - Should cancel refund successfully', async () => {
    mockJiraCancelRefund.mockImplementationOnce(MockJiraCreateRefund.success);

    const params: CancelRefundIssueRequest = {
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      solicitationPspId: faker.datatype.uuid(),
      status: PixRefundStatus.CANCELLED,
      devolutionEndToEndId: faker.datatype.uuid(),
      analisysDetails: faker.datatype.string(),
      rejectionReason: PixRefundRejectionReason.ACCOUNT_CLOSURE,
    };

    const result: CancelRefundIssueResponse = await jiraService
      .getIssueRefundGateway()
      .cancelRefund(params);

    expect(result).toBeDefined();
    expect(result.solicitationPspId).toBe(params.solicitationPspId);
    expect(result.status).toBe(PixRefundStatus.CANCELLED);
    expect(mockJiraCancelRefund).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
