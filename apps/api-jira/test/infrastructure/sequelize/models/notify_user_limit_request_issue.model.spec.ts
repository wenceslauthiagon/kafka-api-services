import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyUserLimitRequestIssueModel } from '@zro/api-jira/infrastructure';
import { NotifyUserLimitRequestIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUserLimitRequestIssueModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-jira.env'] }),
        DatabaseModule.forFeature([NotifyUserLimitRequestIssueModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyIssue =
      await NotifyUserLimitRequestIssueFactory.create<NotifyUserLimitRequestIssueModel>(
        NotifyUserLimitRequestIssueModel.name,
      );
    expect(notifyIssue).toBeDefined();
    expect(notifyIssue.issueId).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
