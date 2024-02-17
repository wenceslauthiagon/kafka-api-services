import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  NotifyPixInfractionIssueEntity,
  NotifyPixInfractionIssueRepository,
} from '@zro/api-jira/domain';
import {
  HandleNotifyCreatePixInfractionIssueEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jira/application';
import { NotifyPixInfractionIssueFactory } from '@zro/test/api-jira/config';

describe('HandleNotifyCreatePixInfractionIssueEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyPixInfractionIssueRepository,
      mockCreateNotifyPixInfractionIssueRepository,
      mockGetNotifyPixInfractionIssueRepository,
    } = mockRepository();
    const { pixPaymentService, mockCreateInfractionService } = mockService();

    const sut = new UseCase(
      logger,
      notifyPixInfractionIssueRepository,
      pixPaymentService,
    );
    return {
      sut,
      mockCreateNotifyPixInfractionIssueRepository,
      mockCreateInfractionService,
      mockGetNotifyPixInfractionIssueRepository,
    };
  };

  const mockRepository = () => {
    const notifyPixInfractionIssueRepository: NotifyPixInfractionIssueRepository =
      createMock<NotifyPixInfractionIssueRepository>();
    const mockCreateNotifyPixInfractionIssueRepository: jest.Mock = On(
      notifyPixInfractionIssueRepository,
    ).get(method((mock) => mock.create));

    const mockGetNotifyPixInfractionIssueRepository: jest.Mock = On(
      notifyPixInfractionIssueRepository,
    ).get(method((mock) => mock.getByIssueIdAndStatus));

    return {
      notifyPixInfractionIssueRepository,
      mockCreateNotifyPixInfractionIssueRepository,
      mockGetNotifyPixInfractionIssueRepository,
    };
  };

  const mockService = () => {
    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();

    const mockCreateInfractionService: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.createPixInfraction),
    );

    return {
      pixPaymentService,
      mockCreateInfractionService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle create issue when issueId, infractionType, operationId, description or status not exists', async () => {
      const {
        sut,
        mockCreateInfractionService,
        mockCreateNotifyPixInfractionIssueRepository,
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

      expect(mockCreateInfractionService).toHaveBeenCalledTimes(0);
      expect(
        mockCreateNotifyPixInfractionIssueRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should handle notify create issue and save in database', async () => {
      const {
        sut,
        mockCreateInfractionService,
        mockCreateNotifyPixInfractionIssueRepository,
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

      await sut.execute(notifyPixInfractionIssue);

      expect(mockCreateInfractionService).toHaveBeenCalledTimes(1);
      expect(
        mockCreateNotifyPixInfractionIssueRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetNotifyPixInfractionIssueRepository).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
