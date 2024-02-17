import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionRefundOperationRepository,
  PixRefundDevolutionEntity,
  PixRefundDevolutionRepository,
  PixRefundEntity,
  PixRefundRepository,
  PixRefundTransactionType,
} from '@zro/pix-payments/domain';
import { CreatePixRefundDevolutionNestObserver as Controller } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  HandleCreatePixRefundDevolutionEventRequest,
  PixRefundDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  PixRefundDevolutionFactory,
  PixRefundFactory,
} from '@zro/test/pix-payments/config';

describe('CreatePixRefundDevolutionController', () => {
  let module: TestingModule;
  let controller: Controller;

  const refundDevolutionRepository: PixRefundDevolutionRepository =
    createMock<PixRefundDevolutionRepository>();
  const mockGetByIdRefundDevolutionRepository: jest.Mock = On(
    refundDevolutionRepository,
  ).get(method((mock) => mock.getById));
  const mockCountByTransactionRefundDevolutionRepository: jest.Mock = On(
    refundDevolutionRepository,
  ).get(method((mock) => mock.countByTransaction));
  const mockCreateRefundDevolutionRepository: jest.Mock = On(
    refundDevolutionRepository,
  ).get(method((mock) => mock.create));

  const refundRepository: PixRefundRepository =
    createMock<PixRefundRepository>();
  const mockGetByIdRefundRepository: jest.Mock = On(refundRepository).get(
    method((mock) => mock.getById),
  );

  const depositRepository: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockGetByIdDepositRepository: jest.Mock = On(depositRepository).get(
    method((mock) => mock.getById),
  );
  const mockUpdateDepositRepository: jest.Mock = On(depositRepository).get(
    method((mock) => mock.update),
  );

  const devolutionReceivedRepository: PixDevolutionReceivedRepository =
    createMock<PixDevolutionReceivedRepository>();
  const mockGetByIdDevolutionReceivedRepository: jest.Mock = On(
    devolutionReceivedRepository,
  ).get(method((mock) => mock.getById));
  const mockUpdateDevolutionReceivedRepository: jest.Mock = On(
    devolutionReceivedRepository,
  ).get(method((mock) => mock.update));

  const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
    createMock<PixInfractionRefundOperationRepository>();

  const serviceRefundDevolutionEventEmitter: PixRefundDevolutionEventEmitterControllerInterface =
    createMock<PixRefundDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(
    serviceRefundDevolutionEventEmitter,
  ).get(method((mock) => mock.emitDevolutionEvent));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateRefund', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create with invalid id', async () => {
        const { state } =
          await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
            PixRefundDevolutionEntity.name,
          );

        const message: HandleCreatePixRefundDevolutionEventRequest = {
          id: null,
          state,
          refundId: null,
        };

        mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
        mockGetByIdRefundRepository.mockResolvedValue(null);

        const testScript = () =>
          controller.execute(
            message,
            refundDevolutionRepository,
            refundRepository,
            depositRepository,
            devolutionReceivedRepository,
            pixInfractionRefundOperationRepository,
            serviceRefundDevolutionEventEmitter,
            logger,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(
          mockCountByTransactionRefundDevolutionRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(
          0,
        );
        expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create refund devolution successfully', async () => {
        const { id, state } =
          await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
            PixRefundDevolutionEntity.name,
          );
        const user = new UserEntity({ uuid: faker.datatype.uuid() });

        const operation = new OperationEntity({ id: faker.datatype.uuid() });

        const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
          {
            createdAt: new Date(),
            amount: 100,
            operation,
            transactionType: PixRefundTransactionType.DEPOSIT,
          },
        );

        const transaction = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            amount: 100,
            returnedAmount: 0,
            user,
            description: 'test',
          },
        );

        mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);
        mockGetByIdRefundRepository.mockResolvedValue(pixRefund);
        mockGetByIdDepositRepository.mockResolvedValue(transaction);
        mockGetByIdDevolutionReceivedRepository.mockResolvedValue(null);

        const message: HandleCreatePixRefundDevolutionEventRequest = {
          id,
          state,
          refundId: pixRefund.id,
        };

        await controller.execute(
          message,
          refundDevolutionRepository,
          refundRepository,
          depositRepository,
          devolutionReceivedRepository,
          pixInfractionRefundOperationRepository,
          serviceRefundDevolutionEventEmitter,
          logger,
        );

        expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCountByTransactionRefundDevolutionRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
        expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(
          1,
        );
        expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should return already existing refund devolution', async () => {
        const refundDevolution =
          await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
            PixRefundDevolutionEntity.name,
          );

        const pixRefund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
        );

        mockGetByIdRefundDevolutionRepository.mockResolvedValue(
          refundDevolution,
        );

        const message: HandleCreatePixRefundDevolutionEventRequest = {
          id: refundDevolution.id,
          state: refundDevolution.state,
          refundId: pixRefund.id,
        };

        await controller.execute(
          message,
          refundDevolutionRepository,
          refundRepository,
          depositRepository,
          devolutionReceivedRepository,
          pixInfractionRefundOperationRepository,
          serviceRefundDevolutionEventEmitter,
          logger,
        );

        expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCountByTransactionRefundDevolutionRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockCreateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRefundRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdDevolutionReceivedRepository).toHaveBeenCalledTimes(
          0,
        );
        expect(mockUpdateDevolutionReceivedRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });
    });
  });
});
