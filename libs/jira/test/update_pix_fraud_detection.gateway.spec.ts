import { v4 as uuidV4 } from 'uuid';
import * as JiraApi from 'jira-client';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UpdatePixFraudDetectionIssueRequest } from '@zro/pix-payments/application';
import { JiraModule, JiraPixService } from '@zro/jira';
import * as MockJiraUpdatePixFraudDetection from '@zro/test/jira/mocks/update_pix_fraud_detection.mock';
import { PixFraudDetectionStatus } from '@zro/pix-payments/domain';

describe('Jira update pix fraud detection.', () => {
  let module: TestingModule;
  let jiraService: JiraPixService;

  const mockJiraUpdateStatusPixFraudDetection = jest.spyOn(
    JiraApi.prototype,
    'transitionIssue',
  );

  const mockJiraUpdateExternalIdPixFraudDetection = jest.spyOn(
    JiraApi.prototype,
    'updateIssue',
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

  it('TC0001 - Should update pix fraud detection external ID successfully', async () => {
    mockJiraUpdateExternalIdPixFraudDetection.mockImplementationOnce(
      MockJiraUpdatePixFraudDetection.successExternalId,
    );

    const params: UpdatePixFraudDetectionIssueRequest = {
      issueId: 1,
      externalId: uuidV4(),
    };

    await jiraService
      .getPixFraudDetectionGateway()
      .updatePixFraudDetectionIssue(params);

    expect(mockJiraUpdateExternalIdPixFraudDetection).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should update pix fraud detection status successfully', async () => {
    mockJiraUpdateStatusPixFraudDetection.mockImplementationOnce(
      MockJiraUpdatePixFraudDetection.successStatus,
    );

    const params: UpdatePixFraudDetectionIssueRequest = {
      issueId: 1,
      status: PixFraudDetectionStatus.CANCELED_RECEIVED,
    };

    await jiraService
      .getPixFraudDetectionGateway()
      .updatePixFraudDetectionIssue(params);

    expect(mockJiraUpdateStatusPixFraudDetection).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
