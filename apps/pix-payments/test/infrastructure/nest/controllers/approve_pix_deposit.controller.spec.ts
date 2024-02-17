import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixDepositRepository,
  PixDepositState,
  WarningPixDepositRepository,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import { OperationEntity, OperationState } from '@zro/operations/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  ApprovePixDepositMicroserviceController as Controller,
  WarningPixDepositDatabaseRepository,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
  WarningPixDepositModel,
  PixDepositModel,
} from '@zro/pix-payments/infrastructure';
import {
  ApprovePixDepositRequest,
  PixDepositEventEmitterControllerInterface,
  PixDepositEventType,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  WarningPixDepositFactory,
} from '@zro/test/pix-payments/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('ApprovePixDepositMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixDepositRepository: PixDepositRepository;
  let warningPixDepositRepository: WarningPixDepositRepository;

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();

  const mockAcceptOperation: jest.Mock = On(operationService).get(
    method((mock) => mock.acceptOperation),
  );

  const mockGetByIdOperation: jest.Mock = On(operationService).get(
    method((mock) => mock.getOperationById),
  );

  const eventEmitter: PixDepositEventEmitterControllerInterface =
    createMock<PixDepositEventEmitterControllerInterface>();
  const mockPixDepositEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDepositEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixDepositRepository = new PixDepositDatabaseRepository();
    warningPixDepositRepository = new WarningPixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should approve pix deposit successfully', async () => {
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { state: OperationState.PENDING },
      );

      mockGetByIdOperation.mockResolvedValue(operation);

      const pixDeposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { state: PixDepositState.WAITING, operationId: operation.id },
      );

      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositModel>(
          WarningPixDepositModel.name,
          { state: WarningPixDepositState.CREATED, operationId: operation.id },
        );

      const message: ApprovePixDepositRequest = {
        operationId: pixDeposit.operationId,
      };

      const result = await controller.execute(
        logger,
        pixDepositRepository,
        warningPixDepositRepository,
        operationService,
        eventEmitter,
        message,
        ctx,
      );

      expect(mockPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockAcceptOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByIdOperation).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.operation.id).toBe(pixDeposit.operationId);
      expect(result.value.operation.id).toBe(warningPixDeposit.operationId);
      expect(result.value.state).toBe(PixDepositState.RECEIVED);
      expect(mockPixDepositEvent.mock.calls[0][0]).toBe(
        PixDepositEventType.RECEIVED,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not approve pix deposit if missing params', async () => {
      const message: ApprovePixDepositRequest = {
        operationId: null,
      };

      const testScript = () =>
        controller.execute(
          logger,
          pixDepositRepository,
          warningPixDepositRepository,
          operationService,
          eventEmitter,
          message,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetByIdOperation).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
