import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyPixFraudDetectionIssueModel } from '@zro/api-jira/infrastructure';
import { NotifyPixFraudDetectionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyPixFraudDetectionIssueModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-jira.env'] }),
        DatabaseModule.forFeature([NotifyPixFraudDetectionIssueModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyIssue =
      await NotifyPixFraudDetectionIssueFactory.create<NotifyPixFraudDetectionIssueModel>(
        NotifyPixFraudDetectionIssueModel.name,
      );
    expect(notifyIssue).toBeDefined();
    expect(notifyIssue.issueId).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
