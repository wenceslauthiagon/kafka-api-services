import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyPixRefundIssueEntity,
  NotifyPixRefundIssueRepository,
} from '@zro/api-jira/domain';
import { PixRefundStatus } from '@zro/pix-payments/domain';
import {
  HandleNotifyUpdatePixRefundIssueEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jira/application';
import { NotifyPixRefundIssueFactory } from '@zro/test/api-jira/config';

describe('HandleNotifyUpdatePixRefundIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyPixRefundIssueRepository,
      mockUpdateNotifyPixRefundIssueRepository,
      mockGetNotifyPixRefundIssueRepository,
    } = mockRepository();
    const {
      pixPaymentService,
      mockCancelRefundService,
      mockCloseRefundService,
    } = mockService();

    const sut = new UseCase(
      logger,
      notifyPixRefundIssueRepository,
      pixPaymentService,
    );
    return {
      sut,
      mockUpdateNotifyPixRefundIssueRepository,
      mockCancelRefundService,
      mockCloseRefundService,
      mockGetNotifyPixRefundIssueRepository,
    };
  };

  const mockRepository = () => {
    const notifyPixRefundIssueRepository: NotifyPixRefundIssueRepository =
      createMock<NotifyPixRefundIssueRepository>();
    const mockUpdateNotifyPixRefundIssueRepository: jest.Mock = On(
      notifyPixRefundIssueRepository,
    ).get(method((mock) => mock.create));
    const mockGetNotifyPixRefundIssueRepository: jest.Mock = On(
      notifyPixRefundIssueRepository,
    ).get(method((mock) => mock.getByIssueIdAndStatus));

    return {
      notifyPixRefundIssueRepository,
      mockUpdateNotifyPixRefundIssueRepository,
      mockGetNotifyPixRefundIssueRepository,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockCancelRefundService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.cancelPixRefund),
    );

    const mockCloseRefundService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.closePixRefund),
    );

    return {
      pixPaymentService,
      mockCancelRefundService,
      mockCloseRefundService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle update issue when issueId, reason, operationId or status not exists', async () => {
      const {
        sut,
        mockCancelRefundService,
        mockCloseRefundService,
        mockUpdateNotifyPixRefundIssueRepository,
      } = makeSut();

      const { issueId, operationId, status, summary } =
        await NotifyPixRefundIssueFactory.create<NotifyPixRefundIssueEntity>(
          NotifyPixRefundIssueEntity.name,
        );

      const test = [
        () =>
          sut.execute(
            new NotifyPixRefundIssueEntity({
              issueId: null,
              operationId,
              status,
              summary,
            }),
          ),
        sut.execute(
          new NotifyPixRefundIssueEntity({
            issueId,
            operationId: null,
            status,
            summary,
          }),
        ),
        sut.execute(
          new NotifyPixRefundIssueEntity({
            issueId,
            operationId,
            status: null,
            summary,
          }),
        ),
        sut.execute(
          new NotifyPixRefundIssueEntity({
            issueId,
            operationId,
            status,
            summary: null,
          }),
        ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockCancelRefundService).toHaveBeenCalledTimes(0);
      expect(mockCloseRefundService).toHaveBeenCalledTimes(0);
      expect(mockUpdateNotifyPixRefundIssueRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should handle notify update issue and save in database', async () => {
      const {
        sut,
        mockCancelRefundService,
        mockCloseRefundService,
        mockUpdateNotifyPixRefundIssueRepository,
        mockGetNotifyPixRefundIssueRepository,
      } = makeSut();
      const notifyPixRefundIssueFactory =
        await NotifyPixRefundIssueFactory.create<NotifyPixRefundIssueEntity>(
          NotifyPixRefundIssueEntity.name,
        );

      const notifyPixRefundIssue = new NotifyPixRefundIssueEntity(
        notifyPixRefundIssueFactory,
      );

      mockGetNotifyPixRefundIssueRepository.mockResolvedValue(null);

      await sut.execute({
        ...notifyPixRefundIssue,
        status: PixRefundStatus.CLOSED,
      });

      expect(mockCancelRefundService).toHaveBeenCalledTimes(0);
      expect(mockCloseRefundService).toHaveBeenCalledTimes(1);
      expect(mockUpdateNotifyPixRefundIssueRepository).toHaveBeenCalledTimes(1);
    });
  });
});
