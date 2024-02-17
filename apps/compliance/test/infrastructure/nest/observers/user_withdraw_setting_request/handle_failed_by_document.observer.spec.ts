import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
  WithdrawSettingType,
} from '@zro/compliance/domain';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  HandleUserWithdrawSettingRequestFailedByDocumentNestObserver as Observer,
  UserWithdrawSettingRequestDatabaseRepository,
} from '@zro/compliance/infrastructure';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('HandleUserWithdrawSettingRequestFailedByDocumentNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);
    userWithdrawSettingRequestRepository =
      new UserWithdrawSettingRequestDatabaseRepository();
  });
  beforeEach(() => jest.resetAllMocks());

  describe('HandleUserWithdrawSettingRequestFailedByDocumentNestObserver', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not handle if missing params', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
            UserWithdrawSettingRequestEntity.name,
            { id: null },
          );

        const message = userWithdrawSettingRequest;

        const testScript = () =>
          observer.execute(
            message,
            userWithdrawSettingRequestRepository,
            logger,
          );

        expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should handle successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
            UserWithdrawSettingRequestEntity.name,
            { type: WithdrawSettingType.DAILY, day: 5 },
          );

        const message = userWithdrawSettingRequest;

        await observer.execute(
          message,
          userWithdrawSettingRequestRepository,
          logger,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
