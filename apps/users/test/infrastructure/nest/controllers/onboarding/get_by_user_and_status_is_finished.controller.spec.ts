import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { OnboardingRepository, OnboardingStatus } from '@zro/users/domain';
import {
  GetOnboardingByUserAndStatusIsFinishedMicroserviceController,
  OnboardingDatabaseRepository,
  OnboardingModel,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetOnboardingByUserAndStatusIsFinishedRequest } from '@zro/users/interface';

describe('OnboardingController', () => {
  let module: TestingModule;
  let controller: GetOnboardingByUserAndStatusIsFinishedMicroserviceController;
  let onboardingRepository: OnboardingRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller =
      module.get<GetOnboardingByUserAndStatusIsFinishedMicroserviceController>(
        GetOnboardingByUserAndStatusIsFinishedMicroserviceController,
      );
    onboardingRepository = new OnboardingDatabaseRepository();
  });

  describe('GetOnboardingByUserAndStatusIsFinished', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const userCreated = await UserFactory.create<UserModel>(UserModel.name);
        const onboarding = await OnboardingFactory.create<OnboardingModel>(
          OnboardingModel.name,
          { status: OnboardingStatus.FINISHED, userId: userCreated.id },
        );

        const message: GetOnboardingByUserAndStatusIsFinishedRequest = {
          userId: userCreated.uuid,
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
        expect(result.value.addressId).toBeNull();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get with id not found', async () => {
        const message: GetOnboardingByUserAndStatusIsFinishedRequest = {
          userId: uuidV4(),
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
