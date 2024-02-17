import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  OnboardingEntity,
  OnboardingRepository,
  OnboardingStatus,
  UserEntity,
} from '@zro/users/domain';
import { GetOnboardingByDocumentAndStatusIsFinishedUseCase as UseCase } from '@zro/users/application';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';

describe('GetOnboardingByUserAndStatusIsFinishedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const onboardingRepository: OnboardingRepository =
      createMock<OnboardingRepository>();
    const mockGetByCpfAndStatusIsFinished: jest.Mock = On(
      onboardingRepository,
    ).get(method((mock) => mock.getByDocumentAndStatusIsFinished));

    const sut = new UseCase(logger, onboardingRepository);
    return { sut, mockGetByCpfAndStatusIsFinished };
  };

  it('TC0001 - Should get onboarding successfully', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const onboarding = await OnboardingFactory.create<OnboardingEntity>(
      OnboardingEntity.name,
      { user, status: OnboardingStatus.FINISHED },
    );

    const { sut, mockGetByCpfAndStatusIsFinished } = makeSut();

    mockGetByCpfAndStatusIsFinished.mockResolvedValue(onboarding);

    const foundOnboarding = await sut.execute(user.document);

    expect(foundOnboarding).toBeDefined();
    expect(foundOnboarding.id).toBe(onboarding.id);
    expect(foundOnboarding.status).toBe(onboarding.status);
    expect(foundOnboarding.user.uuid).toBe(user.uuid);
  });

  it('TC0002 - Should not get onboarding', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const { sut, mockGetByCpfAndStatusIsFinished } = makeSut();

    mockGetByCpfAndStatusIsFinished.mockResolvedValue(null);

    const foundOnboarding = await sut.execute(user.document);

    expect(foundOnboarding).toBeNull();
  });
});
