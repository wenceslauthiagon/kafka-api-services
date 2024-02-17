import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  CloseWarningTransactionMicroserviceController as Controller,
  PixPaymentServiceKafka,
  WarningTransactionDatabaseRepository,
  WarningTransactionModel,
} from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  CloseWarningTransactionRequest,
  WarningTransactionEventEmitterControllerInterface,
  WarningTransactionEventType,
} from '@zro/compliance/interface';
import { WarningTransactionFactory } from '@zro/test/compliance/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CloseWarningTransactionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let warningTransactionRepository: WarningTransactionRepository;

  const eventEmitter: WarningTransactionEventEmitterControllerInterface =
    createMock<WarningTransactionEventEmitterControllerInterface>();

  const mockEmitEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitWarningTransactionEvent),
  );

  const pixPaymentsService: PixPaymentServiceKafka =
    createMock<PixPaymentServiceKafka>();

  const mockBlockPix: jest.Mock = On(pixPaymentsService).get(
    method((mock) => mock.blockPixDeposit),
  );

  const mockApprovePix: jest.Mock = On(pixPaymentsService).get(
    method((mock) => mock.approvePixDeposit),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    warningTransactionRepository = new WarningTransactionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should close warning transaction successfully and approve pix deposit', async () => {
      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionModel>(
          WarningTransactionModel.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.REJECTED,
          },
        );

      const message: CloseWarningTransactionRequest = {
        operationId: warningTransaction.operationId,
        analysisResult: warningTransaction.analysisResult,
      };

      const result = await controller.execute(
        warningTransactionRepository,
        eventEmitter,
        pixPaymentsService,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.operation.id).toBe(warningTransaction.operationId);
      expect(result.value.status).toBe(WarningTransactionStatus.CLOSED);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockBlockPix).toHaveBeenCalledTimes(0);
      expect(mockApprovePix).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        WarningTransactionEventType.CLOSED,
      );
    });

    it('TC0002 - Should close warning transaction successfully and block pix deposit', async () => {
      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionModel>(
          WarningTransactionModel.name,
          {
            analysisResult: WarningTransactionAnalysisResultType.APPROVED,
          },
        );

      const message: CloseWarningTransactionRequest = {
        operationId: warningTransaction.operationId,
        analysisResult: warningTransaction.analysisResult,
      };

      const result = await controller.execute(
        warningTransactionRepository,
        eventEmitter,
        pixPaymentsService,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.operation.id).toBe(warningTransaction.operationId);
      expect(result.value.status).toBe(WarningTransactionStatus.CLOSED);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockBlockPix).toHaveBeenCalledTimes(1);
      expect(mockApprovePix).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        WarningTransactionEventType.CLOSED,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not close warning transaction if payload values are null', async () => {
      const operationId = faker.datatype.uuid();

      const message: CloseWarningTransactionRequest = {
        operationId,
        analysisResult: null,
      };

      const testScript = () =>
        controller.execute(
          warningTransactionRepository,
          eventEmitter,
          pixPaymentsService,
          logger,
          message,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);

      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockBlockPix).toHaveBeenCalledTimes(0);
      expect(mockApprovePix).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
