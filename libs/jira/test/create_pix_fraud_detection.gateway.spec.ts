import { v4 as uuidV4 } from 'uuid';
import { cpf } from 'cpf-cnpj-validator';
import * as JiraApi from 'jira-client';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JiraModule, JiraPixService } from '@zro/jira';
import { PixFraudDetectionType } from '@zro/pix-payments/domain';
import {
  CreatePixFraudDetectionIssueRequest,
  CreatePixFraudDetectionIssueResponse,
} from '@zro/pix-payments/application';
import * as MockJiraCreatePixFraudDetection from '@zro/test/jira/mocks/create_pix_fraud_detection.mock';

describe('Jira create pix fraud detection.', () => {
  let module: TestingModule;
  let jiraService: JiraPixService;

  const mockJiraCreatePixFraudDetection = jest.spyOn(
    JiraApi.prototype,
    'addNewIssue',
  );
  const mockJiraUpdateStatusPixFraudDetection = jest.spyOn(
    JiraApi.prototype,
    'transitionIssue',
  );

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

  it('TC0001 - Should create pix fraud detection. successfully', async () => {
    mockJiraCreatePixFraudDetection.mockImplementationOnce(
      MockJiraCreatePixFraudDetection.success,
    );
    mockJiraUpdateStatusPixFraudDetection.mockResolvedValue(null);

    const params: CreatePixFraudDetectionIssueRequest = {
      externalId: uuidV4(),
      document: cpf.generate(),
      fraudType: PixFraudDetectionType.DUMMY_ACCOUNT,
      key: uuidV4(),
    };

    const result: CreatePixFraudDetectionIssueResponse = await jiraService
      .getPixFraudDetectionGateway()
      .createPixFraudDetectionIssue(params);

    expect(result).toBeDefined();
    expect(result.issueId).toBeDefined();
    expect(mockJiraCreatePixFraudDetection).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
