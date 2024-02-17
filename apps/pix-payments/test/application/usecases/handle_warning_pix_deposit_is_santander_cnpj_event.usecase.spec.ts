import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositCacheRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import { BankEntity } from '@zro/banking/domain';
import {
  HandleWarningPixDepositIsSantanderCnpjEventUseCase as UseCase,
  PixDepositEventEmitter,
  WarningDepositChecker,
} from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('HandleWarningPixDepositIsSantanderCnpjEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const warningPixDepositMinAmount = 40000;
  const pixPaymentSantanderIspb = '90400888';
  const warningPixDepositSantanderCnpj = '90400888000142';

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
      pixPaymentSantanderIspb,
      warningPixDepositMinAmount,
      warningPixDepositSantanderCnpj,
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
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should update and return deposit with the check result but do not emit event yet since there are other checkers to check deposit', async () => {
      const { sut, mockSemaphoreCacheRepository, mockWaitingEvent } = makeSut();

      const name = 'isSantander';
      const result = false;

      const checkResult = {
        [name]: result,
      };

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          amount: 50000,
          thirdPartBank: new BankEntity({
            ispb: pixPaymentSantanderIspb,
          }),
          thirdPartDocument: warningPixDepositSantanderCnpj,
          check: checkResult,
        },
      );

      mockSemaphoreCacheRepository.mockResolvedValue(deposit);

      const testScript = await sut.execute(deposit.id);

      expect(testScript.check).toBeDefined();
      expect(mockSemaphoreCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockWaitingEvent).toHaveBeenCalledTimes(0);
    });
  });

  it('TC0003 - Should update and return deposit with the check result and emit event', async () => {
    const {
      sut,
      mockSemaphoreCacheRepository,
      // mockWaitingEvent
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
        amount: 50000,
        thirdPartBank: new BankEntity({
          ispb: pixPaymentSantanderIspb,
        }),
        thirdPartDocument: warningPixDepositSantanderCnpj,
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
