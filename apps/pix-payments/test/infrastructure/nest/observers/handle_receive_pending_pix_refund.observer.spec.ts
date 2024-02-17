import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { InvalidDataFormatException, KafkaService } from '@zro/common';
import {
  PixRefundRepository,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixRefundEntity,
  PixRefundState,
  PixRefundTransactionType,
  PixDepositEntity,
  PixDevolutionReceivedEntity,
  PixInfractionEntity,
} from '@zro/pix-payments/domain';
import { IssueRefundGateway } from '@zro/pix-payments/application';
import { ReceivePendingPixRefundNestObserver as Controller } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  HandleReceivePendingPixRefundRequest,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  PixRefundFactory,
  PixDepositFactory,
  PixDevolutionReceivedFactory,
} from '@zro/test/pix-payments/config';
import * as createRefundGatewayMock from '@zro/test/pix-payments/config/mocks/create_refund_gateway.mock';
import { KafkaContext } from '@nestjs/microservices';

describe('ReceiveRefundMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const refundEventEmitter: PixRefundEventEmitterControllerInterface =
    createMock<PixRefundEventEmitterControllerInterface>();
  const mockEmitRefundEvent: jest.Mock = On(refundEventEmitter).get(
    method((mock) => mock.emitPixRefundEvent),
  );

  const refundGateway: IssueRefundGateway = createMock<IssueRefundGateway>();
  const mockCreateRefundGateway: jest.Mock = On(refundGateway).get(
    method((mock) => mock.createRefund),
  );

  const refundRepository: PixRefundRepository =
    createMock<PixRefundRepository>();
  const mockGetRefundByIdRepository: jest.Mock = On(refundRepository).get(
    method((mock) => mock.getById),
  );
  const mockUpdateRefundRepository: jest.Mock = On(refundRepository).get(
    method((mock) => mock.update),
  );

  const depositRepository: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockGetDepositByIdRepository: jest.Mock = On(depositRepository).get(
    method((mock) => mock.getById),
  );

  const devolutionReceivedRepository: PixDevolutionReceivedRepository =
    createMock<PixDevolutionReceivedRepository>();
  const mockGetDevolutionReceivedByIdRepository: jest.Mock = On(
    devolutionReceivedRepository,
  ).get(method((mock) => mock.getById));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ReceiveRefund', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update Refund successfully when deposit without infraction associate (block account)', async () => {
        const refund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
          {
            state: PixRefundState.RECEIVE_PENDING,
            transactionType: PixRefundTransactionType.DEPOSIT,
            infraction: null,
          },
        );
        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );

        mockGetRefundByIdRepository.mockResolvedValue(refund);
        mockCreateRefundGateway.mockImplementationOnce(
          createRefundGatewayMock.success,
        );
        mockGetDepositByIdRepository.mockResolvedValue(deposit);

        const { id, state } = refund;

        const message: HandleReceivePendingPixRefundRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          refundGateway,
          refundRepository,
          depositRepository,
          devolutionReceivedRepository,
          refundEventEmitter,
          logger,
          ctx,
        );

        expect(mockGetRefundByIdRepository).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
          0,
        );
        expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateRefundGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should update Refund successfully when devolution received with infraction associate (dont block account)', async () => {
        const refund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
          {
            state: PixRefundState.RECEIVE_PENDING,
            transactionType: PixRefundTransactionType.DEVOLUTION_RECEIVED,
            infraction: new PixInfractionEntity({ id: faker.datatype.uuid() }),
          },
        );
        const devolutionReceived =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
            PixDevolutionReceivedEntity.name,
          );

        mockGetRefundByIdRepository.mockResolvedValue(refund);
        mockCreateRefundGateway.mockImplementationOnce(
          createRefundGatewayMock.success,
        );
        mockGetDevolutionReceivedByIdRepository.mockResolvedValue(
          devolutionReceived,
        );

        const { id, state } = refund;

        const message: HandleReceivePendingPixRefundRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          refundGateway,
          refundRepository,
          depositRepository,
          devolutionReceivedRepository,
          refundEventEmitter,
          logger,
          ctx,
        );

        expect(mockGetRefundByIdRepository).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
          1,
        );
        expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateRefundGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not update with invalid id', async () => {
        const refund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
        );

        mockGetRefundByIdRepository.mockResolvedValue(null);
        mockCreateRefundGateway.mockImplementationOnce(
          createRefundGatewayMock.success,
        );

        const { state } = refund;

        const message: HandleReceivePendingPixRefundRequest = {
          id: null,
          state,
        };

        const testScript = () =>
          controller.execute(
            message,
            refundGateway,
            refundRepository,
            depositRepository,
            devolutionReceivedRepository,
            refundEventEmitter,
            logger,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockGetRefundByIdRepository).toHaveBeenCalledTimes(0);
        expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
          0,
        );
        expect(mockUpdateRefundRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRefundGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
