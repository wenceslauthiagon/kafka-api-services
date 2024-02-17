import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyWarningTransactionIssueModel } from '@zro/api-jira/infrastructure';
import { WarningTransactionAnalysisResultType } from '@zro/compliance/domain';
import { NotifyWarningTransactionIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyWarningTransactionIssueModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-jira.env'] }),
        DatabaseModule.forFeature([NotifyWarningTransactionIssueModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyIssue =
      await NotifyWarningTransactionIssueFactory.create<NotifyWarningTransactionIssueModel>(
        NotifyWarningTransactionIssueModel.name,
        {
          analysisResult: WarningTransactionAnalysisResultType.APPROVED,
          analysisDetails: 'Pix bloqueado por motivos de teste.',
        },
      );
    expect(notifyIssue).toBeDefined();
    expect(notifyIssue.issueId).toBeDefined();
    expect(notifyIssue.status).toBeDefined();
    expect(notifyIssue.state).toBeDefined();
    expect(notifyIssue.operationId).toBeDefined();
    expect(notifyIssue.summary).toBeDefined();
    expect(notifyIssue.analysisResult).toBeDefined();
    expect(notifyIssue.analysisDetails).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
