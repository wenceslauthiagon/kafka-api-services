import * as JiraApi from 'jira-client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PixInfractionStatus } from '@zro/pix-payments/domain';
import {
  InvalidUpdateInfractionStatusPixPaymentPspException,
  UpdateInfractionStatusIssueInfractionRequest,
} from '@zro/pix-payments/application';
import { JiraModule, JiraPixService } from '@zro/jira';
import * as MockJiraUpdateInfractionStatus from '@zro/test/jira/mocks/update_infraction_status.mock';

describe('Jira update infraction status', () => {
  let module: TestingModule;
  let jiraService: JiraPixService;

  const mockUpdateInfractionStatus = jest.spyOn(
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

  it('TC0001 - Should update infraction status successfully', async () => {
    mockUpdateInfractionStatus.mockImplementationOnce(
      MockJiraUpdateInfractionStatus.success,
    );

    const params: UpdateInfractionStatusIssueInfractionRequest = {
      issueId: faker.datatype.number({ min: 1, max: 9999 }),
      status: PixInfractionStatus.OPEN,
    };

    await jiraService.getPixInfractionGateway().updateInfractionStatus(params);

    expect(mockUpdateInfractionStatus).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not update with invalid status', async () => {
    mockUpdateInfractionStatus.mockImplementationOnce(
      MockJiraUpdateInfractionStatus.invalidStatus,
    );

    const params: UpdateInfractionStatusIssueInfractionRequest = {
      issueId: faker.datatype.number({ min: 1, max: 9999 }),
      status: PixInfractionStatus.OPEN,
    };

    const testScript = () =>
      jiraService.getPixInfractionGateway().updateInfractionStatus(params);

    await expect(testScript).rejects.toThrow(
      InvalidUpdateInfractionStatusPixPaymentPspException,
    );

    expect(mockUpdateInfractionStatus).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
