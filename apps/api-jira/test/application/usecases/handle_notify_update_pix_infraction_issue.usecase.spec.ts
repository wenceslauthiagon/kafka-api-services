import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyPixInfractionIssueEntity,
  NotifyPixInfractionIssueRepository,
} from '@zro/api-jira/domain';
import { PixInfractionStatus } from '@zro/pix-payments/domain';
import {
  HandleNotifyUpdatePixInfractionIssueEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jira/application';
import { NotifyPixInfractionIssueFactory } from '@zro/test/api-jira/config';

describe('HandleNotifyUpdatePixInfractionIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyPixInfractionIssueRepository,
      mockUpdateNotifyPixInfractionIssueRepository,
      mockGetNotifyPixInfractionIssueRepository,
    } = mockRepository();
    const {
      pixPaymentService,
      mockOpenInfractionService,
      mockInAnalysisInfractionService,
      mockCloseInfractionService,
    } = mockService();

    const sut = new UseCase(
      logger,
      notifyPixInfractionIssueRepository,
      pixPaymentService,
    );
    return {
      sut,
      mockUpdateNotifyPixInfractionIssueRepository,
      mockOpenInfractionService,
      mockInAnalysisInfractionService,
      mockCloseInfractionService,
      mockGetNotifyPixInfractionIssueRepository,
    };
  };

  const mockRepository = () => {
    const notifyPixInfractionIssueRepository: NotifyPixInfractionIssueRepository =
      createMock<NotifyPixInfractionIssueRepository>();
    const mockUpdateNotifyPixInfractionIssueRepository: jest.Mock = On(
      notifyPixInfractionIssueRepository,
    ).get(method((mock) => mock.create));

    const mockGetNotifyPixInfractionIssueRepository: jest.Mock = On(
      notifyPixInfractionIssueRepository,
    ).get(method((mock) => mock.getByIssueIdAndStatus));

    return {
      notifyPixInfractionIssueRepository,
      mockUpdateNotifyPixInfractionIssueRepository,
      mockGetNotifyPixInfractionIssueRepository,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockOpenInfractionService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.openPixInfraction),
    );

    const mockInAnalysisInfractionService: jest.Mock = On(
      pixPaymentService,
    ).get(method((mock) => mock.inAnalysisPixInfraction));

    const mockCloseInfractionService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.closePixInfraction),
    );

    return {
      pixPaymentService,
      mockOpenInfractionService,
      mockInAnalysisInfractionService,
      mockCloseInfractionService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle update issue when issueId, infractionType, operationId, description or status not exists', async () => {
      const {
        sut,
        mockOpenInfractionService,
        mockInAnalysisInfractionService,
        mockCloseInfractionService,
        mockUpdateNotifyPixInfractionIssueRepository,
      } = makeSut();

      const notify =
        await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueEntity>(
          NotifyPixInfractionIssueEntity.name,
        );
      const { issueId, infractionType, operationId, status, summary } = notify;

      const test = [
        () =>
          sut.execute(
            new NotifyPixInfractionIssueEntity({
              issueId: null,
              infractionType,
              operationId,
              status,
              summary,
            }),
          ),
        sut.execute(
          new NotifyPixInfractionIssueEntity({
            issueId,
            infractionType: null,
            operationId,
            status,
            summary,
          }),
        ),
        sut.execute(
          new NotifyPixInfractionIssueEntity({
            issueId,
            infractionType,
            operationId: null,
            status,
            summary,
          }),
        ),
        sut.execute(
          new NotifyPixInfractionIssueEntity({
            issueId,
            infractionType,
            operationId,
            status: null,
            summary,
          }),
        ),
        sut.execute(
          new NotifyPixInfractionIssueEntity({
            issueId,
            infractionType,
            operationId,
            status,
            summary: null,
          }),
        ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockOpenInfractionService).toHaveBeenCalledTimes(0);
      expect(mockInAnalysisInfractionService).toHaveBeenCalledTimes(0);
      expect(mockCloseInfractionService).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateNotifyPixInfractionIssueRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should handle notify update issue and save in database', async () => {
      const {
        sut,
        mockOpenInfractionService,
        mockInAnalysisInfractionService,
        mockCloseInfractionService,
        mockUpdateNotifyPixInfractionIssueRepository,
        mockGetNotifyPixInfractionIssueRepository,
      } = makeSut();
      const notifyPixInfractionIssueFactory =
        await NotifyPixInfractionIssueFactory.create<NotifyPixInfractionIssueEntity>(
          NotifyPixInfractionIssueEntity.name,
        );

      const notifyPixInfractionIssue = new NotifyPixInfractionIssueEntity(
        notifyPixInfractionIssueFactory,
      );

      mockGetNotifyPixInfractionIssueRepository.mockResolvedValue(null);

      await sut.execute({
        ...notifyPixInfractionIssue,
        status: PixInfractionStatus.OPENED,
      });

      expect(mockOpenInfractionService).toHaveBeenCalledTimes(1);
      expect(mockInAnalysisInfractionService).toHaveBeenCalledTimes(0);
      expect(mockCloseInfractionService).toHaveBeenCalledTimes(0);
      expect(
        mockUpdateNotifyPixInfractionIssueRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
