import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { cpf } from 'cpf-cnpj-validator';
import { defaultLogger as logger } from '@zro/common';
import { OnboardingRepository, OnboardingStatus } from '@zro/users/domain';
import {
  GetOnboardingByDocumentAndStatusIsFinishedMicroserviceController,
  OnboardingDatabaseRepository,
  OnboardingModel,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetOnboardingByDocumentAndStatusIsFinishedRequest } from '@zro/users/interface';

describe('OnboardingController', () => {
  let module: TestingModule;
  let controller: GetOnboardingByDocumentAndStatusIsFinishedMicroserviceController;
  let onboardingRepository: OnboardingRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller =
      module.get<GetOnboardingByDocumentAndStatusIsFinishedMicroserviceController>(
        GetOnboardingByDocumentAndStatusIsFinishedMicroserviceController,
      );
    onboardingRepository = new OnboardingDatabaseRepository();
  });

  describe('GetOnboardingByDocumentAndStatusIsFinished', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);
        const onboarding = await OnboardingFactory.create<OnboardingModel>(
          OnboardingModel.name,
          {
            status: OnboardingStatus.FINISHED,
            userId: user.id,
            document: user.document,
          },
        );

        const message: GetOnboardingByDocumentAndStatusIsFinishedRequest = {
          document: user.document,
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
        expect(result.value.fullName).toBe(onboarding.fullName);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get', async () => {
        const message: GetOnboardingByDocumentAndStatusIsFinishedRequest = {
          document: cpf.generate(),
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
