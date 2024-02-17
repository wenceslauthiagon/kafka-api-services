import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  KafkaService,
  defaultLogger as logger,
} from '@zro/common';
import {
  PixInfractionRepository,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionEntity,
  PixInfractionState,
  PixInfractionTransactionType,
  PixDepositEntity,
  PixDevolutionReceivedEntity,
} from '@zro/pix-payments/domain';
import { IssueInfractionGateway } from '@zro/pix-payments/application';
import { ReceivePendingPixInfractionNestObserver as Controller } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  HandleReceivePendingPixInfractionRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import * as createInfractionGatewayMock from '@zro/test/pix-payments/config/mocks/create_infraction_gateway.mock';
import {
  InfractionFactory,
  PixDepositFactory,
  PixDevolutionReceivedFactory,
} from '@zro/test/pix-payments/config';
import { KafkaContext } from '@nestjs/microservices';

describe('ReceiveInfractionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const infractionEventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(infractionEventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const infractionGateway: IssueInfractionGateway =
    createMock<IssueInfractionGateway>();
  const mockCreateInfractionGateway: jest.Mock = On(infractionGateway).get(
    method((mock) => mock.createInfraction),
  );
  const mockUpdateInfractionGateway: jest.Mock = On(infractionGateway).get(
    method((mock) => mock.updateInfraction),
  );

  const infractionRepository: PixInfractionRepository =
    createMock<PixInfractionRepository>();
  const mockGetInfractionByIdRepository: jest.Mock = On(
    infractionRepository,
  ).get(method((mock) => mock.getById));
  const mockUpdateInfractionRepository: jest.Mock = On(
    infractionRepository,
  ).get(method((mock) => mock.update));

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

  describe('ReceiveInfraction', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update infraction successfully when deposit', async () => {
        const infraction = await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
          {
            state: PixInfractionState.RECEIVE_PENDING,
            transactionType: PixInfractionTransactionType.DEPOSIT,
          },
        );
        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );

        mockGetInfractionByIdRepository.mockResolvedValue(infraction);
        mockCreateInfractionGateway.mockImplementationOnce(
          createInfractionGatewayMock.success,
        );
        mockGetDepositByIdRepository.mockResolvedValue(deposit);

        const { id, state } = infraction;

        const message: HandleReceivePendingPixInfractionRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          infractionGateway,
          infractionRepository,
          depositRepository,
          devolutionReceivedRepository,
          infractionEventEmitter,
          logger,
          ctx,
        );

        expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(1);
        expect(mockGetDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
          0,
        );
        expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateInfractionGateway).toHaveBeenCalledTimes(1);
        expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should update infraction successfully when devolution received', async () => {
        const infraction = await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
          {
            state: PixInfractionState.RECEIVE_PENDING,
            transactionType: PixInfractionTransactionType.DEVOLUTION_RECEIVED,
          },
        );
        const devolutionReceived =
          await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
            PixDevolutionReceivedEntity.name,
          );

        mockGetInfractionByIdRepository.mockResolvedValue(infraction);
        mockCreateInfractionGateway.mockImplementationOnce(
          createInfractionGatewayMock.success,
        );
        mockGetDevolutionReceivedByIdRepository.mockResolvedValue(
          devolutionReceived,
        );

        const { id, state } = infraction;

        const message: HandleReceivePendingPixInfractionRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          infractionGateway,
          infractionRepository,
          depositRepository,
          devolutionReceivedRepository,
          infractionEventEmitter,
          logger,
          ctx,
        );

        expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
        expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
          1,
        );
        expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateInfractionGateway).toHaveBeenCalledTimes(1);
        expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not update with invalid id', async () => {
        const infraction = await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );

        mockGetInfractionByIdRepository.mockResolvedValue(null);

        mockCreateInfractionGateway.mockImplementationOnce(
          createInfractionGatewayMock.success,
        );

        const { state } = infraction;

        const message: HandleReceivePendingPixInfractionRequest = {
          id: null,
          state,
        };

        const testScript = () =>
          controller.execute(
            message,
            infractionGateway,
            infractionRepository,
            depositRepository,
            devolutionReceivedRepository,
            infractionEventEmitter,
            logger,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
        expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(0);
        expect(mockGetDevolutionReceivedByIdRepository).toHaveBeenCalledTimes(
          0,
        );
        expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateInfractionGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
