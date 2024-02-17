import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase as UseCase } from '@zro/api-jira/application';
import {
  NotifyUserWithdrawSettingRequestIssueEntity,
  NotifyUserWithdrawSettingRequestIssueRepository,
} from '@zro/api-jira/domain';
import { NotifyUserWithdrawSettingRequestIssueFactory } from '@zro/test/api-jira/config';

describe('HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyUserWithdrawSettingRequestIssueRepository,
      mockCreateNotifyUserWithdrawSettingRequestIssueRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      notifyUserWithdrawSettingRequestIssueRepository,
    );
    return {
      sut,
      mockCreateNotifyUserWithdrawSettingRequestIssueRepository,
    };
  };

  const mockRepository = () => {
    const notifyUserWithdrawSettingRequestIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository =
      createMock<NotifyUserWithdrawSettingRequestIssueRepository>();
    const mockCreateNotifyUserWithdrawSettingRequestIssueRepository: jest.Mock =
      On(notifyUserWithdrawSettingRequestIssueRepository).get(
        method((mock) => mock.create),
      );

    return {
      notifyUserWithdrawSettingRequestIssueRepository,
      mockCreateNotifyUserWithdrawSettingRequestIssueRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle notify failed update issue and save in database', async () => {
      const { sut, mockCreateNotifyUserWithdrawSettingRequestIssueRepository } =
        makeSut();
      const notifyUserWithdrawSettingRequestIssue =
        await NotifyUserWithdrawSettingRequestIssueFactory.create<NotifyUserWithdrawSettingRequestIssueEntity>(
          NotifyUserWithdrawSettingRequestIssueEntity.name,
        );

      await sut.execute(notifyUserWithdrawSettingRequestIssue);

      expect(
        mockCreateNotifyUserWithdrawSettingRequestIssueRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
