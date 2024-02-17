import * as JiraApi from 'jira-client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { WarningTransactionStatus } from '@zro/compliance/domain';
import {
  InvalidUpdateWarningTransactionStatusToClosedCompliancePspException,
  UpdateWarningTransactionStatusToClosedIssueRequest,
} from '@zro/compliance/application';
import { JiraModule, JiraComplianceService } from '@zro/jira';
import * as MockJiraUpdateWarningTransactionStatusToClosed from '@zro/test/jira/mocks/update_warning_transaction_status_to_closed.mock';

describe('Jira update warning transaction status to closed', () => {
  let module: TestingModule;
  let jiraService: JiraComplianceService;

  const mockUpdateWarningTransactionStatusToClosed = jest.spyOn(
    JiraApi.prototype,
    'transitionIssue',
  );

  const mockGetIssue = jest.spyOn(JiraApi.prototype, 'getIssue');

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jira.env', '.compliance.env'] }),
        JiraModule,
      ],
    }).compile();

    jiraService = module.get(JiraComplianceService);
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should update warning transaction status to closed successfully', async () => {
    mockGetIssue.mockImplementationOnce(
      MockJiraUpdateWarningTransactionStatusToClosed.getIssueSuccess,
    );
    mockUpdateWarningTransactionStatusToClosed.mockImplementationOnce(
      MockJiraUpdateWarningTransactionStatusToClosed.transitionSuccess,
    );

    const params: UpdateWarningTransactionStatusToClosedIssueRequest = {
      issueId: faker.datatype.number({ min: 1, max: 9999 }),
      status: WarningTransactionStatus.CLOSED,
    };

    await jiraService
      .getWarningTransactionGateway()
      .updateWarningTransactionStatusToClosed(params);

    expect(mockGetIssue).toHaveBeenCalledTimes(1);
    expect(mockUpdateWarningTransactionStatusToClosed).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not update with invalid issue ID', async () => {
    mockGetIssue.mockImplementationOnce(
      MockJiraUpdateWarningTransactionStatusToClosed.getIssueInvalidId,
    );

    const params: UpdateWarningTransactionStatusToClosedIssueRequest = {
      issueId: faker.datatype.number({ min: 1, max: 9999 }),
      status: WarningTransactionStatus.PENDING,
    };

    const testScript = () =>
      jiraService
        .getWarningTransactionGateway()
        .updateWarningTransactionStatusToClosed(params);

    await expect(testScript).rejects.toThrow(
      InvalidUpdateWarningTransactionStatusToClosedCompliancePspException,
    );

    expect(mockGetIssue).toHaveBeenCalledTimes(1);
    expect(mockUpdateWarningTransactionStatusToClosed).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
