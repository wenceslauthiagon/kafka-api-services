import * as JiraApi from 'jira-client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { OperationEntity } from '@zro/operations/domain';
import { PixInfractionType } from '@zro/pix-payments/domain';
import {
  CreateInfractionIssueInfractionRequest,
  CreateInfractionIssueInfractionResponse,
} from '@zro/pix-payments/application';
import { JiraModule, JiraPixService } from '@zro/jira';
import * as MockJiraCreateInfraction from '@zro/test/jira/mocks/create_infraction.mock';

describe('Jira create infraction', () => {
  let module: TestingModule;
  let jiraService: JiraPixService;

  const mockJiraCreateInfraction = jest.spyOn(JiraApi.prototype, 'addNewIssue');

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

  it('TC0001 - Should create infraction successfully', async () => {
    mockJiraCreateInfraction.mockImplementationOnce(
      MockJiraCreateInfraction.success,
    );

    const params: CreateInfractionIssueInfractionRequest = {
      clientDocument: faker.datatype.string(),
      description: faker.datatype.string(),
      infractionType: PixInfractionType.FRAUD,
      operation: new OperationEntity({ id: faker.datatype.uuid() }),
    };

    const result: CreateInfractionIssueInfractionResponse = await jiraService
      .getPixInfractionGateway()
      .createInfraction(params);

    expect(result).toBeDefined();
    expect(result.issueId).toBeDefined();
    expect(result.key).toBeDefined();
    expect(mockJiraCreateInfraction).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
