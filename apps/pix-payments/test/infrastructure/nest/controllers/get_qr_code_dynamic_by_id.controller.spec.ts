import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import { QrCodeDynamicNotFoundException } from '@zro/pix-payments/application';
import {
  GetQrCodeDynamicByIdMicroserviceController as Controller,
  QrCodeDynamicDatabaseRepository,
  QrCodeDynamicModel,
} from '@zro/pix-payments/infrastructure';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';
import { UserFactory } from '@zro/test/users/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';
import { GetByQrCodeStaticIdRequest } from '@zro/pix-payments/interface';

describe('CreateQrCodeDynamicMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let qrCodeDynamicRepository: QrCodeDynamicRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    qrCodeDynamicRepository = new QrCodeDynamicDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetQrCodeDynamicById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get qrCodeDynamic successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const qrCodeDynamic =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            {
              state: PixQrCodeDynamicState.READY,
              userId: user.uuid,
            },
          );

        const message: GetByQrCodeStaticIdRequest = {
          id: qrCodeDynamic.id,
          userId: user.uuid,
        };
        const result = await controller.execute(
          qrCodeDynamicRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(qrCodeDynamic.id);
        expect(result.value.emv).toBe(qrCodeDynamic.emv);
        expect(result.value.txId).toBe(qrCodeDynamic.txId);
        expect(result.value.expirationDate.toString()).toBe(
          qrCodeDynamic.expirationDate.toString(),
        );
        expect(result.value.description).toBe(qrCodeDynamic.description);
        expect(result.value.keyId).toBe(qrCodeDynamic.keyId);
        expect(result.value.documentValue).toBe(qrCodeDynamic.documentValue);
        expect(result.value.state).toBe(qrCodeDynamic.state);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get if qrCodeDynamic is not found', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const message: GetByQrCodeStaticIdRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
        };

        const testScript = () =>
          controller.execute(qrCodeDynamicRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(
          QrCodeDynamicNotFoundException,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
