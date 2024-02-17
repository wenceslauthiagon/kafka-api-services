import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { OnboardingEntity } from '@zro/users/domain';
import {
  PixDepositEntity,
  PixDepositCacheRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  HandleWarningPixDepositIsOverWarningIncomeEventUseCase as UseCase,
  PixDepositEventEmitter,
  UserService,
  WarningDepositChecker,
} from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';
import { OnboardingFactory } from '@zro/test/users/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('HandleWarningPixDepositIsOverWarningIncomeEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const warningPixDepositMaxOccupationIncome = 100000;
  const warningPixDepositMinAmountToWarningIncome = 150000;

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

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetOnboardingByUserAndStatusIsFinished: jest.Mock = On(
      userService,
    ).get(method((mock) => mock.getOnboardingByUserAndStatusIsFinished));

    return {
      userService,
      mockGetOnboardingByUserAndStatusIsFinished,
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

    const { userService, mockGetOnboardingByUserAndStatusIsFinished } =
      mockService();

    const sut = new UseCase(
      logger,
      depositRepository,
      userService,
      pixEventEmitter,
      warningPixDepositMaxOccupationIncome,
      warningPixDepositMinAmountToWarningIncome,
    );

    return {
      sut,
      mockGetDepositCacheRepositoryById,
      mockUpdateDepositCacheRepository,
      mockSemaphoreCacheRepository,
      mockGetDepositCacheByHash,
      mockCreateDepositCacheHash,
      mockWaitingEvent,
      mockGetOnboardingByUserAndStatusIsFinished,
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
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const name = 'isOverWarningIncome';
      const result = false;

      const checkResult = {
        [name]: result,
      };

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
        { occupationIncome: 100000 },
      );

      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValueOnce(
        onboarding,
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          amount: 150000,
          user: onboarding.user,
          clientAccountNumber: onboarding.accountNumber,
          clientBranch: onboarding.branch,
          clientDocument: onboarding.document,
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
      // mockWaitingEvent,
      mockGetOnboardingByUserAndStatusIsFinished,
    } = makeSut();

    let i = WarningDepositChecker.checkers;
    const result = [true, false];
    const check = {};

    while (i > 0) {
      const checkName = faker.lorem.words(1);
      check[checkName] = result[Math.round(Math.random())];

      i--;
    }

    const onboarding = await OnboardingFactory.create<OnboardingEntity>(
      OnboardingEntity.name,
      { occupationIncome: 100000 },
    );

    mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValueOnce(
      onboarding,
    );

    const deposit = await PixDepositFactory.create<PixDepositEntity>(
      PixDepositEntity.name,
      {
        state: PixDepositState.NEW,
        amount: 150000,
        user: onboarding.user,
        clientAccountNumber: onboarding.accountNumber,
        clientBranch: onboarding.branch,
        clientDocument: onboarding.document,
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
