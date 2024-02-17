import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { OnboardingRepository, OnboardingStatus } from '@zro/users/domain';
import {
  GetOnboardingByAccountNumberAndStatusIsFinishedMicroserviceController,
  OnboardingDatabaseRepository,
  OnboardingModel,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import { GetOnboardingByAccountNumberAndStatusIsFinishedRequest } from '@zro/users/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('OnboardingController', () => {
  let module: TestingModule;
  let controller: GetOnboardingByAccountNumberAndStatusIsFinishedMicroserviceController;
  let onboardingRepository: OnboardingRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller =
      module.get<GetOnboardingByAccountNumberAndStatusIsFinishedMicroserviceController>(
        GetOnboardingByAccountNumberAndStatusIsFinishedMicroserviceController,
      );
    onboardingRepository = new OnboardingDatabaseRepository();
  });

  describe('GetOnboardingByAccountNumberAndStatusIsFinished', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);
        const onboarding = await OnboardingFactory.create<OnboardingModel>(
          OnboardingModel.name,
          { status: OnboardingStatus.FINISHED, userId: user.id },
        );

        const message: GetOnboardingByAccountNumberAndStatusIsFinishedRequest =
          {
            accountNumber: onboarding.accountNumber,
          };

        const result = await controller.execute(
          onboardingRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(onboarding.id);
        expect(result.value.status).toBe(onboarding.status);
        expect(result.value.userId).toBe(user.uuid);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get with id not found', async () => {
        const message: GetOnboardingByAccountNumberAndStatusIsFinishedRequest =
          {
            accountNumber: uuidV4(),
          };

        const result = await controller.execute(
          onboardingRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
