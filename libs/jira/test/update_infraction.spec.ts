import * as JiraApi from 'jira-client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { OperationEntity } from '@zro/operations/domain';
import {
  PixInfractionAnalysisResultType,
  PixInfractionType,
  PixInfractionReport,
} from '@zro/pix-payments/domain';
import { UpdateInfractionIssueInfractionRequest } from '@zro/pix-payments/application';
import { JiraModule, JiraPixService } from '@zro/jira';
import * as MockJiraUpdateInfraction from '@zro/test/jira/mocks/update_infraction.mock';

describe('Jira update infraction', () => {
  let module: TestingModule;
  let jiraService: JiraPixService;

  const mockUpdateInfraction = jest.spyOn(JiraApi.prototype, 'updateIssue');

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

  it('TC0001 - Should update infraction successfully', async () => {
    mockUpdateInfraction.mockImplementationOnce(
      MockJiraUpdateInfraction.success,
    );

    const params: UpdateInfractionIssueInfractionRequest = {
      issueId: faker.datatype.number({ min: 1, max: 99999 }),
      infractionPspId: faker.datatype.uuid(),
      analysisResult: PixInfractionAnalysisResultType.DISAGREED,
      ispbDebitedParticipant: faker.datatype
        .number(999999)
        .toString()
        .padStart(8, '0'),
      ispbCreditedParticipant: faker.datatype
        .number(999999)
        .toString()
        .padStart(8, '0'),
      reportBy: PixInfractionReport.CREDITED_PARTICIPANT,
      endToEndId: faker.datatype.uuid(),
      summary: faker.datatype.string(),
      description: faker.datatype.string(),
      infractionType: PixInfractionType.FRAUD,
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
    };

    await jiraService.getPixInfractionGateway().updateInfraction(params);

    expect(mockUpdateInfraction).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
