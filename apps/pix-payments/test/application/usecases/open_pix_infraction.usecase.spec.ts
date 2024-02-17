import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
} from '@zro/pix-payments/domain';
import {
  OpenPixInfractionUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('OpenInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockOpenPendingInfractionReceivedEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.openPendingInfraction));

    return {
      eventEmitter,
      mockOpenPendingInfractionReceivedEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));

    const mockGetInfractionByIssueRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getByIssueId));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIssueRepository,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockGetInfractionByIssueRepository,
      mockUpdateInfractionRepository,
    } = mockRepository();
    const { eventEmitter, mockOpenPendingInfractionReceivedEvent } =
      mockEmitter();

    const sut = new UseCase(logger, infractionRepository, eventEmitter);
    return {
      sut,
      mockGetInfractionByIssueRepository,
      infractionRepository,
      mockUpdateInfractionRepository,
      mockOpenPendingInfractionReceivedEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetInfractionByIssueRepository,
        mockUpdateInfractionRepository,
        mockOpenPendingInfractionReceivedEvent,
      } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionByIssueRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockOpenPendingInfractionReceivedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to open if infraction not exists', async () => {
      const {
        sut,
        mockGetInfractionByIssueRepository,
        mockUpdateInfractionRepository,
        mockOpenPendingInfractionReceivedEvent,
      } = makeSut();
      const { issueId, description } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );
      mockGetInfractionByIssueRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(issueId, description);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetInfractionByIssueRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockOpenPendingInfractionReceivedEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - should update infraction successfully', async () => {
      const {
        sut,
        mockGetInfractionByIssueRepository,
        mockUpdateInfractionRepository,
        mockOpenPendingInfractionReceivedEvent,
      } = makeSut();
      const { issueId, description } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );

      const result = await sut.execute(issueId, description);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.OPENED);
      expect(result.state).toEqual(PixInfractionState.OPEN_PENDING);
      expect(mockGetInfractionByIssueRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockOpenPendingInfractionReceivedEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - should return infraction if it already exists OPEN_PENDING', async () => {
      const {
        sut,
        mockGetInfractionByIssueRepository,
        mockUpdateInfractionRepository,
        mockOpenPendingInfractionReceivedEvent,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.OPEN_PENDING },
      );

      const { issueId, description } = infraction;

      mockGetInfractionByIssueRepository.mockResolvedValue(infraction);

      const result = await sut.execute(issueId, description);

      expect(result).toBeDefined();
      expect(result.state).toEqual(PixInfractionState.OPEN_PENDING);
      expect(mockGetInfractionByIssueRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockOpenPendingInfractionReceivedEvent).toHaveBeenCalledTimes(0);
    });
  });
});
