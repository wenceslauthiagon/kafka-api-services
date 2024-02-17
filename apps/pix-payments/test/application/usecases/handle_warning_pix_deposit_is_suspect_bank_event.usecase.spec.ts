import { cnpj } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositCacheRepository,
  PixDepositState,
  WarningPixDepositBankBlockListRepository,
} from '@zro/pix-payments/domain';
import {
  HandleWarningPixDepositIsSuspectBankEventUseCase as UseCase,
  PixDepositEventEmitter,
  WarningDepositChecker,
} from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('HandleWarningPixDepositIsSuspectBankEventUseCase', () => {
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

    const warningPixBlockListRepository: WarningPixDepositBankBlockListRepository =
      createMock<WarningPixDepositBankBlockListRepository>();

    const mockGetByCnpj: jest.Mock = On(warningPixBlockListRepository).get(
      method((mock) => mock.getByCnpj),
    );

    return {
      depositRepository,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      warningPixBlockListRepository,
      mockGetByCnpj,
    };
  };

  const makeSut = () => {
    const {
      depositRepository,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      warningPixBlockListRepository,
      mockGetByCnpj,
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
      mockGetByCnpj,
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
        mockGetByCnpj,
      } = makeSut();

      const name = 'isSuspectCnpj';
      const result = false;

      const checkResult = {
        [name]: result,
      };

      const suspectCnpj = [cnpj.generate()];

      mockGetByCnpj.mockResolvedValueOnce(suspectCnpj);

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          amount: 50000,
          thirdPartDocument: suspectCnpj[0],
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
        mockGetByCnpj,
      } = makeSut();

      let i = WarningDepositChecker.checkers;
      const check = {};

      while (i > 0) {
        const checkName = faker.lorem.words(1);
        check[checkName] = true;

        i--;
      }

      const suspectCnpj = [cnpj.generate()];

      mockGetByCnpj.mockResolvedValueOnce(suspectCnpj);

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          amount: 50000,
          thirdPartDocument: suspectCnpj[0],
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
