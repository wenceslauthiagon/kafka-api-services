import * as JiraApi from 'jira-client';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  CreateUserWithdrawSettingRequestGatewayRequest,
  CreateUserWithdrawSettingRequestGatewayResponse,
} from '@zro/compliance/application';
import { JiraModule, JiraComplianceService } from '@zro/jira';
import * as MockJiraCreateUserWithdrawSettingRequest from '@zro/test/jira/mocks/create_user_withdraw_setting_request.mock';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';
import { UserWithdrawSettingRequestEntity } from '@zro/compliance/domain';

describe('Jira user withdraw setting request', () => {
  let module: TestingModule;
  let jiraService: JiraComplianceService;

  const mockJiraCreateUserWithdrawSettingRequest = jest.spyOn(
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

  it('TC0001 - Should create user withdraw setting request successfully', async () => {
    mockJiraCreateUserWithdrawSettingRequest.mockImplementationOnce(
      MockJiraCreateUserWithdrawSettingRequest.success,
    );

    const params: CreateUserWithdrawSettingRequestGatewayRequest =
      await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
        UserWithdrawSettingRequestEntity.name,
      );

    const result: CreateUserWithdrawSettingRequestGatewayResponse =
      await jiraService.getUserWithdrawSettingRequestGateway().create(params);

    expect(result).toBeDefined();
    expect(result.issueId).toBeDefined();
    expect(result.key).toBeDefined();
    expect(mockJiraCreateUserWithdrawSettingRequest).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
