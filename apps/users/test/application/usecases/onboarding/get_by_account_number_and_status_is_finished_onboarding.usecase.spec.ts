import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  OnboardingEntity,
  OnboardingRepository,
  OnboardingStatus,
} from '@zro/users/domain';
import { GetOnboardingByAccountNumberAndStatusIsFinishedUseCase as UseCase } from '@zro/users/application';
import { OnboardingFactory } from '@zro/test/users/config';

describe('GetOnboardingByAccountNumberAndStatusIsFinishedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const onboardingRepository: OnboardingRepository =
      createMock<OnboardingRepository>();
    const mockGetByAccountNumberAndStatusIsFinished: jest.Mock = On(
      onboardingRepository,
    ).get(method((mock) => mock.getByAccountNumberAndStatusIsFinished));

    const sut = new UseCase(logger, onboardingRepository);

    return { sut, mockGetByAccountNumberAndStatusIsFinished };
  };

  it('TC0001 - Should get onboarding successfully', async () => {
    const onboarding = await OnboardingFactory.create<OnboardingEntity>(
      OnboardingEntity.name,
      { status: OnboardingStatus.FINISHED },
    );

    const { sut, mockGetByAccountNumberAndStatusIsFinished } = makeSut();

    mockGetByAccountNumberAndStatusIsFinished.mockResolvedValue(onboarding);

    const foundOnboarding = await sut.execute(onboarding.accountNumber);

    expect(foundOnboarding).toBeDefined();
    expect(foundOnboarding.id).toBe(onboarding.id);
    expect(foundOnboarding.status).toBe(onboarding.status);
    expect(foundOnboarding.accountNumber).toBe(onboarding.accountNumber);
    expect(foundOnboarding.address).not.toBeDefined();
  });

  it('TC0002 - Should not get onboarding', async () => {
    const accountNumber = '999999';

    const { sut, mockGetByAccountNumberAndStatusIsFinished } = makeSut();

    mockGetByAccountNumberAndStatusIsFinished.mockResolvedValue(null);

    const foundOnboarding = await sut.execute(accountNumber);

    expect(foundOnboarding).toBeNull();
  });
});
