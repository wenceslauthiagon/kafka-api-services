import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyUserWithdrawSettingRequestIssueModel } from '@zro/api-jira/infrastructure';
import { UserWithdrawSettingRequestAnalysisResultType } from '@zro/compliance/domain';
import { NotifyUserWithdrawSettingRequestIssueFactory } from '@zro/test/api-jira/config';

describe('NotifyUserWithdrawSettingRequestIssueModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-jira.env'] }),
        DatabaseModule.forFeature([NotifyUserWithdrawSettingRequestIssueModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyIssue =
      await NotifyUserWithdrawSettingRequestIssueFactory.create<NotifyUserWithdrawSettingRequestIssueModel>(
        NotifyUserWithdrawSettingRequestIssueModel.name,
        {
          analysisResult: UserWithdrawSettingRequestAnalysisResultType.APPROVED,
        },
      );
    expect(notifyIssue).toBeDefined();
    expect(notifyIssue.issueId).toBeDefined();
    expect(notifyIssue.status).toBeDefined();
    expect(notifyIssue.state).toBeDefined();
    expect(notifyIssue.userWithdrawSettingRequestId).toBeDefined();
    expect(notifyIssue.summary).toBeDefined();
    expect(notifyIssue.analysisResult).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
