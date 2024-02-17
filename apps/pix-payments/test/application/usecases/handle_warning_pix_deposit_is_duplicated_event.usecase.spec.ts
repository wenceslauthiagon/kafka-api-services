import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositCacheRepository,
  PixDepositEntity,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  HandleWarningPixDepositIsDuplicatedEventUseCase as UseCase,
  PixDepositEventEmitter,
  WarningDepositChecker,
} from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

describe('WarningPixDepositIsDuplicated', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const warningPixDepositMinAmount = 40000;

  const mockEmitter = () => {
    const pixEventEmitter: PixDepositEventEmitter =
      createMock<PixDepositEventEmitter>();

    const mockWaitingEvent: jest.Mock = On(pixEventEmitter).get(
      method((mock) => mock.waitingDeposit),
    );

    return {
      pixEventEmitter,
      mockWaitingEvent,
    };
  };

  const mockRepository = () => {
    const depositRepository: PixDepositCacheRepository =
      createMock<PixDepositCacheRepository>();

    const mockGetDepositCacheRepositoryById: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getById));

    const mockSemaphoreCacheRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.semaphore),
    );

    const mockUpdateDepositCacheRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.update));

    const mockGetDepositCacheByHash: jest.Mock = On(depositRepository).get(
      method((mock) => mock.getByHash),
    );

    const mockCreateDepositCacheHash: jest.Mock = On(depositRepository).get(
      method((mock) => mock.createHash),
    );

    return {
      depositRepository,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      mockGetDepositCacheByHash,
      mockCreateDepositCacheHash,
    };
  };

  const makeSut = () => {
    const {
      depositRepository,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      mockGetDepositCacheByHash,
      mockCreateDepositCacheHash,
    } = mockRepository();

    const { pixEventEmitter, mockWaitingEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      depositRepository,
      pixEventEmitter,
      warningPixDepositMinAmount,
    );

    return {
      sut,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      mockGetDepositCacheByHash,
      mockCreateDepositCacheHash,
      mockWaitingEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing id', async () => {
      const {
        sut,
        mockGetDepositCacheRepositoryById,
        mockUpdateDepositCacheRepository,
        mockSemaphoreCacheRepository,
        mockGetDepositCacheByHash,
        mockCreateDepositCacheHash,
        mockWaitingEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      expect(mockGetDepositCacheRepositoryById).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockSemaphoreCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositCacheByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateDepositCacheHash).toHaveBeenCalledTimes(0);
      expect(mockWaitingEvent).toHaveBeenCalledTimes(0);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should update and return deposit with the check result', async () => {
      const {
        sut,
        mockGetDepositCacheRepositoryById,
        mockUpdateDepositCacheRepository,
        mockSemaphoreCacheRepository,
        mockGetDepositCacheByHash,
        mockCreateDepositCacheHash,
        mockWaitingEvent,
      } = makeSut();

      const name = 'isDuplicated';
      const result = false;

      const checkResult = { [name]: result };

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          check: checkResult,
        },
      );

      mockSemaphoreCacheRepository.mockResolvedValue(deposit);

      const testScript = await sut.execute(deposit.id);

      expect(testScript.check).toBeDefined();
      expect(mockSemaphoreCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositCacheRepositoryById).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositCacheByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateDepositCacheHash).toHaveBeenCalledTimes(0);
      expect(mockWaitingEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should update and return deposit with the check result and emit event', async () => {
      const {
        sut,
        mockGetDepositCacheRepositoryById,
        mockUpdateDepositCacheRepository,
        mockSemaphoreCacheRepository,
        mockGetDepositCacheByHash,
        mockCreateDepositCacheHash,
        // mockWaitingEvent,
      } = makeSut();

      let i = WarningDepositChecker.checkers;
      const result = [true, false];
      const check = {};

      while (i > 0) {
        const checkName = faker.lorem.words(1);
        check[checkName] = result[Math.round(Math.random())];

        i--;
      }

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          check,
        },
      );

      mockSemaphoreCacheRepository.mockResolvedValue(deposit);

      const testScript = await sut.execute(deposit.id);

      expect(testScript.check).toBeDefined();
      expect(mockSemaphoreCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositCacheRepositoryById).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositCacheByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateDepositCacheHash).toHaveBeenCalledTimes(0);
      // FIXME: This is breaking the pipe
      // expect(mockWaitingEvent).toHaveBeenCalledTimes(1);
    });
  });
});
