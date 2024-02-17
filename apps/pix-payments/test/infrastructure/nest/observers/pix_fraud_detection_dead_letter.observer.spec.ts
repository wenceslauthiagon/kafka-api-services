import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  PixFraudDetectionRepository,
  PixFraudDetectionState,
} from '@zro/pix-payments/domain';
import {
  PixFraudDetectionDeadLetterFraudDetectionNestObserver as Observer,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionModel,
} from '@zro/pix-payments/infrastructure';
import { HandlePixFraudDetectionDeadLetterEventRequest } from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('PixFraudDetectionDeadLetterFraudDetectionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixFraudDetectionRepository: PixFraudDetectionRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    pixFraudDetectionRepository = new PixFraudDetectionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should execute PixFraudDetectionEntity successfully.', async () => {
      const pixFraudDetection =
        await PixFraudDetectionFactory.create<PixFraudDetectionModel>(
          PixFraudDetectionModel.name,
          {
            state: PixFraudDetectionState.REGISTERED_PENDING,
          },
        );

      const message: HandlePixFraudDetectionDeadLetterEventRequest = {
        id: pixFraudDetection.id,
        failedMessage: 'test',
        failedCode: 'test',
      };

      const spyRepositoryUpdate = jest.spyOn(
        pixFraudDetectionRepository,
        'update',
      );

      await controller.execute(message, pixFraudDetectionRepository, logger);
      expect(spyRepositoryUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const message: HandlePixFraudDetectionDeadLetterEventRequest = {
        id: null,
        failedMessage: 'test',
        failedCode: 'test',
      };

      const spyRepositoryUpdate = jest.spyOn(
        pixFraudDetectionRepository,
        'update',
      );

      const testScript = () =>
        controller.execute(message, pixFraudDetectionRepository, logger);

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(spyRepositoryUpdate).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
