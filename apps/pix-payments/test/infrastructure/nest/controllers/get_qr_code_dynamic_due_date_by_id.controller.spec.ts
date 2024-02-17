import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { getMoment, defaultLogger as logger } from '@zro/common';
import { QrCodeDynamicRepository } from '@zro/pix-payments/domain';
import {
  PixPaymentGateway,
  QrCodeDynamicDueDateNotFoundException,
} from '@zro/pix-payments/application';
import {
  GetQrCodeDynamicDueDateByIdMicroserviceController as Controller,
  QrCodeDynamicDatabaseRepository,
  QrCodeDynamicModel,
} from '@zro/pix-payments/infrastructure';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';
import { GetQrCodeDynamicDueDateByIdRequest } from '@zro/pix-payments/interface';

describe('CreateQrCodeDynamicMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let qrCodeDynamicRepository: QrCodeDynamicRepository;

  const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    qrCodeDynamicRepository = new QrCodeDynamicDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetQrCodeDynamicDueDateById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get qrCodeDynamicDueDate successfully', async () => {
        const qrCodeNotExpiredDate = getMoment().subtract(1, 'day').toDate();

        const qrCodeDynamic =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            {
              dueDate: getMoment().toDate(),
              expirationDate: getMoment().toDate(),
            },
          );

        const message: GetQrCodeDynamicDueDateByIdRequest = {
          id: qrCodeDynamic.id,
          paymentDate: qrCodeNotExpiredDate,
        };
        const result = await controller.execute(
          qrCodeDynamicRepository,
          pspGateway,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.payloadJws).toBeDefined();
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
      it('TC0002- Should throw QrCodeDynamicDueDateNotFoundException if qrCodeDynamicDueDate is not found', async () => {
        const message: GetQrCodeDynamicDueDateByIdRequest = {
          id: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicRepository,
            pspGateway,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          QrCodeDynamicDueDateNotFoundException,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
