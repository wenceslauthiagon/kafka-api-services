import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixRefundRepository,
  PixDevolutionReceivedRepository,
  PixDepositRepository,
  PixRefundEntity,
  PixDepositEntity,
  PixRefundTransactionType,
  PixInfractionRepository,
  PixInfractionEntity,
  PixInfractionAnalysisResultType,
  PixInfractionState,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import { OperationEntity } from '@zro/operations/domain';
import { PixTransactionNotFoundException } from '@zro/pix-payments/application';
import {
  ReceivePixRefundNestObserver as Observer,
  OperationServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  PixRefundEventEmitterControllerInterface,
  HandleReceivePixRefundEventRequest,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixRefundFactory,
  PixDepositFactory,
  InfractionFactory,
} from '@zro/test/pix-payments/config';

describe('ReceiveRefundMicroserviceController', () => {
  let module: TestingModule;
  let controller: Observer;

  const eventEmitter: PixRefundEventEmitterControllerInterface =
    createMock<PixRefundEventEmitterControllerInterface>();
  const mockEmitRefundEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitPixRefundEvent),
  );

  const refundRepository: PixRefundRepository =
    createMock<PixRefundRepository>();
  const mockGetRefundByIdRepository: jest.Mock = On(refundRepository).get(
    method((mock) => mock.getBySolicitationId),
  );

  const infractionRepository: PixInfractionRepository =
    createMock<PixInfractionRepository>();
  const mockGetInfractionByPspIdRepository: jest.Mock = On(
    infractionRepository,
  ).get(method((mock) => mock.getByInfractionPspId));

  const depositRepository: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockGetDepositByEndToEndIdRepository: jest.Mock = On(
    depositRepository,
  ).get(method((mock) => mock.getByEndToEndId));

  const devolutionReceivedRepository: PixDevolutionReceivedRepository =
    createMock<PixDevolutionReceivedRepository>();
  const mockGetDevolutionReceivedByEndToEndIdRepository: jest.Mock = On(
    devolutionReceivedRepository,
  ).get(method((mock) => mock.getByEndToEndId));

  const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
    createMock<PixInfractionRefundOperationRepository>();

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getOperationById),
  );
  const mockCreateOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.createOperation),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ReceiveRefund', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create refund with infraction successfully', async () => {
        const infractionGenerated =
          await InfractionFactory.create<PixInfractionEntity>(
            PixInfractionEntity.name,
            {
              analysisResult: PixInfractionAnalysisResultType.AGREED,
              state: PixInfractionState.CLOSED_CONFIRMED,
            },
          );

        const refund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
          {
            transactionType: PixRefundTransactionType.DEPOSIT,
            infraction: infractionGenerated,
          },
        );

        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );

        mockGetRefundByIdRepository.mockResolvedValueOnce(null);
        mockGetDepositByEndToEndIdRepository.mockResolvedValueOnce(deposit);
        mockGetInfractionByPspIdRepository.mockResolvedValue(
          infractionGenerated,
        );

        const {
          id,
          infraction,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        } = refund;

        const message: HandleReceivePixRefundEventRequest = {
          id,
          infractionId: infraction.infractionPspId,
          contested,
          amount,
          description,
          reason,
          requesterIspb: requesterBank.ispb,
          responderIspb: responderBank.ispb,
          status,
          endToEndIdTransaction: transaction.endToEndId,
          solicitationPspId,
        };

        await controller.execute(
          refundRepository,
          infractionRepository,
          depositRepository,
          devolutionReceivedRepository,
          pixInfractionRefundOperationRepository,
          eventEmitter,
          operationService,
          logger,
          message,
        );

        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should create refund without infraction successfully (block account)', async () => {
        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );
        const refund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
          {
            transactionType: PixRefundTransactionType.DEPOSIT,
            infraction: null,
            transaction: deposit,
          },
        );

        mockGetRefundByIdRepository.mockResolvedValueOnce(null);
        mockGetDepositByEndToEndIdRepository.mockResolvedValueOnce(deposit);
        mockGetOperationService.mockResolvedValue(deposit.operation);
        mockCreateOperationService.mockResolvedValue({
          owner: new OperationEntity({
            id: deposit.operation.id,
            value: deposit.amount,
          }),
        });

        const {
          id,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        } = refund;

        const message: HandleReceivePixRefundEventRequest = {
          id,
          infractionId: null,
          contested,
          amount,
          description,
          reason,
          requesterIspb: requesterBank.ispb,
          responderIspb: responderBank.ispb,
          status,
          endToEndIdTransaction: transaction.endToEndId,
          solicitationPspId,
        };

        await controller.execute(
          refundRepository,
          infractionRepository,
          depositRepository,
          devolutionReceivedRepository,
          pixInfractionRefundOperationRepository,
          eventEmitter,
          operationService,
          logger,
          message,
        );

        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not create with invalid id', async () => {
        const {
          infraction,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        } = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
        );

        const message: HandleReceivePixRefundEventRequest = {
          id: null,
          infractionId: infraction.infractionPspId,
          contested,
          amount,
          description,
          reason,
          requesterIspb: requesterBank.ispb,
          responderIspb: responderBank.ispb,
          status,
          endToEndIdTransaction: transaction.endToEndId,
          solicitationPspId,
        };

        const testScript = () =>
          controller.execute(
            refundRepository,
            infractionRepository,
            depositRepository,
            devolutionReceivedRepository,
            pixInfractionRefundOperationRepository,
            eventEmitter,
            operationService,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not create if transaction does not exist', async () => {
        const refund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
        );

        mockGetDepositByEndToEndIdRepository.mockResolvedValueOnce(null);
        mockGetDevolutionReceivedByEndToEndIdRepository.mockResolvedValueOnce(
          null,
        );
        mockGetRefundByIdRepository.mockResolvedValueOnce(null);

        const {
          id,
          infraction,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        } = refund;

        const message: HandleReceivePixRefundEventRequest = {
          id,
          infractionId: infraction.infractionPspId,
          contested,
          amount,
          description,
          reason,
          requesterIspb: requesterBank.ispb,
          responderIspb: responderBank.ispb,
          status,
          endToEndIdTransaction: transaction.endToEndId,
          solicitationPspId,
        };

        const testScript = () =>
          controller.execute(
            refundRepository,
            infractionRepository,
            depositRepository,
            devolutionReceivedRepository,
            pixInfractionRefundOperationRepository,
            eventEmitter,
            operationService,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(
          PixTransactionNotFoundException,
        );
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
