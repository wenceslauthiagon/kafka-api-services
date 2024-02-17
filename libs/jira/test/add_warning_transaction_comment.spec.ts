import * as JiraApi from 'jira-client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AddWarningTransactionCommentRequest } from '@zro/pix-payments/application';
import { JiraModule, JiraComplianceService } from '@zro/jira';
import * as MockJiraCreateWarningTransaction from '@zro/test/jira/mocks/create_warning_transaction.mock';

describe('Jira create warning transaction', () => {
  let module: TestingModule;
  let jiraService: JiraComplianceService;

  const mockJiraAddWarningTransactionComment = jest.spyOn(
    JiraApi.prototype,
    'addComment',
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
    mockJiraAddWarningTransactionComment.mockImplementationOnce(
      MockJiraCreateWarningTransaction.success,
    );

    const params: AddWarningTransactionCommentRequest = {
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      text: 'Estorno realizado pelo próprio usuário pelo aplicativo.',
    };

    await jiraService
      .getWarningTransactionGateway()
      .addWarningTransactionComment(params);

    expect(mockJiraAddWarningTransactionComment).toBeCalledWith(
      params.issueId.toString(),
      params.text,
    );
    expect(mockJiraAddWarningTransactionComment).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
