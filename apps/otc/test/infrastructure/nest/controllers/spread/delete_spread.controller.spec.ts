import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SpreadRepository } from '@zro/otc/domain';
import {
  DeleteSpreadMicroserviceController as Controller,
  SpreadDatabaseRepository,
  SpreadModel,
  OperationServiceKafka,
} from '@zro/otc/infrastructure';
import { SpreadFactory } from '@zro/test/otc/config';
import {
  DeleteSpreadRequest,
  SpreadEventEmitterControllerInterface,
  SpreadEventType,
} from '@zro/otc/interface';
import { CurrencyEntity } from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('DeleteSpreadMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let spreadRepository: SpreadRepository;

  const eventEmitter: SpreadEventEmitterControllerInterface =
    createMock<SpreadEventEmitterControllerInterface>();
  const mockEmitSpreadEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitSpreadEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    spreadRepository = new SpreadDatabaseRepository();
  });

  beforeEach(jest.resetAllMocks);

  describe('DeleteSpread', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should delete spread successfully', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );

        mockGetCurrencyOperationService.mockResolvedValue(currency);

        const currencySymbol = currency.symbol;

        const message: DeleteSpreadRequest = {
          currencySymbol,
        };

        await controller.execute(
          spreadRepository,
          eventEmitter,
          operationService,
          logger,
          message,
        );

        expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
        expect(mockEmitSpreadEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitSpreadEvent.mock.calls[0][0]).toBe(
          SpreadEventType.DELETED,
        );
      });

      it('TC0002 - Should not delete if incorrect provider', async () => {
        const spread = await SpreadFactory.create<SpreadModel>(
          SpreadModel.name,
        );

        const { currencySymbol } = spread;

        const message: DeleteSpreadRequest = {
          currencySymbol,
        };

        await controller.execute(
          spreadRepository,
          eventEmitter,
          operationService,
          logger,
          message,
        );

        expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
        expect(mockEmitSpreadEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
