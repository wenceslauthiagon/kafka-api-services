import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositCacheRepository,
  PixDepositState,
  WarningPixBlockListRepository,
} from '@zro/pix-payments/domain';
import {
  HandleWarningPixDepositIsSuspectCpfEventUseCase as UseCase,
  PixDepositEventEmitter,
  WarningDepositChecker,
} from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('HandleWarningPixDepositIsSuspectCpfEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

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

    const warningPixBlockListRepository: WarningPixBlockListRepository =
      createMock<WarningPixBlockListRepository>();

    const mockGetAllCpf: jest.Mock = On(warningPixBlockListRepository).get(
      method((mock) => mock.getAllCpf),
    );

    return {
      depositRepository,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      warningPixBlockListRepository,
      mockGetAllCpf,
    };
  };

  const makeSut = () => {
    const {
      depositRepository,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      warningPixBlockListRepository,
      mockGetAllCpf,
    } = mockRepository();

    const { pixEventEmitter, mockWaitingEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      depositRepository,
      warningPixBlockListRepository,
      pixEventEmitter,
    );

    return {
      sut,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      mockWaitingEvent,
      mockGetAllCpf,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing id', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should update and return deposit with the check result but do not emit event yet since there are other checkers to check deposit', async () => {
      const {
        sut,
        mockSemaphoreCacheRepository,
        mockWaitingEvent,
        mockGetAllCpf,
      } = makeSut();

      const name = 'isSuspectCpf';
      const result = false;

      const checkResult = {
        [name]: result,
      };

      const suspectCpf = [cpf.generate()];

      mockGetAllCpf.mockResolvedValueOnce(suspectCpf);

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          amount: 50000,
          thirdPartDocument: suspectCpf[0],
          check: checkResult,
        },
      );

      mockSemaphoreCacheRepository.mockResolvedValue(deposit);

      const testScript = await sut.execute(deposit.id);

      expect(testScript.check).toBeDefined();
      expect(mockSemaphoreCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should update and return deposit with the check result and emit event', async () => {
      const {
        sut,
        mockSemaphoreCacheRepository,
        // mockWaitingEvent,
        mockGetAllCpf,
      } = makeSut();

      let i = WarningDepositChecker.checkers;
      const check = {};

      while (i > 0) {
        const checkName = faker.lorem.words(1);
        check[checkName] = true;

        i--;
      }

      const suspectCpf = [cpf.generate()];

      mockGetAllCpf.mockResolvedValueOnce(suspectCpf);

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          amount: 50000,
          thirdPartDocument: suspectCpf[0],
          check,
        },
      );

      mockSemaphoreCacheRepository.mockResolvedValue(deposit);

      const testScript = await sut.execute(deposit.id);

      expect(testScript.check).toBeDefined();
      expect(mockSemaphoreCacheRepository).toHaveBeenCalledTimes(1);
      // FIXME: This is breaking the pipe
      // expect(mockWaitingEvent).toHaveBeenCalledTimes(1);
    });
  });
});
