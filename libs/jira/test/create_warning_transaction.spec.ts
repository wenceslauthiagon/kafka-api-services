import { v4 as uuidV4 } from 'uuid';
import * as JiraApi from 'jira-client';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { OperationEntity } from '@zro/operations/domain';
import {
  CreateWarningTransactionRequest,
  CreateWarningTransactionResponse,
} from '@zro/compliance/application';
import { JiraModule, JiraComplianceService } from '@zro/jira';
import * as MockJiraCreateWarningTransaction from '@zro/test/jira/mocks/create_warning_transaction.mock';

describe('Jira create warning transaction', () => {
  let module: TestingModule;
  let jiraService: JiraComplianceService;

  const mockJiraCreateWarningTransaction = jest.spyOn(
    JiraApi.prototype,
    'addNewIssue',
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jira.env'] }),
        JiraModule,
      ],
    }).compile();

    jiraService = module.get(JiraComplianceService);
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should create warning transaction successfully', async () => {
    mockJiraCreateWarningTransaction.mockImplementationOnce(
      MockJiraCreateWarningTransaction.success,
    );

    const params: CreateWarningTransactionRequest = {
      reason: '',
      transactionTag: 'PIXREC',
      operation: new OperationEntity({ id: uuidV4() }),
      endToEndId: 'test',
    };

    const result: CreateWarningTransactionResponse = await jiraService
      .getWarningTransactionGateway()
      .createWarningTransaction(params);

    expect(result).toBeDefined();
    expect(result.issueId).toBeDefined();
    expect(mockJiraCreateWarningTransaction).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
