import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  OnboardingEntity,
  OnboardingRepository,
  OnboardingStatus,
  UserEntity,
} from '@zro/users/domain';
import { GetOnboardingByUserAndStatusIsFinishedUseCase as UseCase } from '@zro/users/application';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';

describe('GetOnboardingByUserAndStatusIsFinishedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const onboardingRepository: OnboardingRepository =
      createMock<OnboardingRepository>();
    const mockGetByUserAndStatusIsFinished: jest.Mock = On(
      onboardingRepository,
    ).get(method((mock) => mock.getByUserAndStatusIsFinished));

    const sut = new UseCase(logger, onboardingRepository);
    return { sut, mockGetByUserAndStatusIsFinished };
  };

  it('TC0001 - Should get onboarding successfully', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const onboarding = await OnboardingFactory.create<OnboardingEntity>(
      OnboardingEntity.name,
      { user, status: OnboardingStatus.FINISHED },
    );

    const { sut, mockGetByUserAndStatusIsFinished } = makeSut();

    mockGetByUserAndStatusIsFinished.mockResolvedValue(onboarding);

    const foundOnboarding = await sut.execute(user);

    expect(foundOnboarding).toBeDefined();
    expect(foundOnboarding.id).toBe(onboarding.id);
    expect(foundOnboarding.status).toBe(onboarding.status);
    expect(foundOnboarding.user.uuid).toBe(user.uuid);
    expect(foundOnboarding.address).not.toBeDefined();
  });

  it('TC0002 - Should not get onboarding', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const { sut, mockGetByUserAndStatusIsFinished } = makeSut();

    mockGetByUserAndStatusIsFinished.mockResolvedValue(null);

    const foundOnboarding = await sut.execute(user);

    expect(foundOnboarding).toBeNull();
  });
});
