import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositState,
  PixInfractionRefundOperationRepository,
  PixInfractionRefundOperationState,
} from '@zro/pix-payments/domain';
import { OperationService } from '@zro/pix-payments/application';
import {
  CreatePixInfractionRefundOperationNestObserver as Observer,
  PixInfractionRefundOperationDatabaseRepository,
  PixInfractionRefundOperationModel,
} from '@zro/pix-payments/infrastructure';
import { HandleCreatePixInfractionRefundOperationEventRequest } from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDepositFactory,
  PixInfractionRefundOperationFactory,
} from '@zro/test/pix-payments/config';
import { OperationEntity, OperationState } from '@zro/operations/domain';
import { OperationFactory } from '@zro/test/operations/config';

describe('CreatePixInfractionRefundOperationNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository;

  const operationService: OperationService = createMock<OperationService>();
  const mockGetOperationById: jest.Mock = On(operationService).get(
    method((mock) => mock.getOperationById),
  );
  const mockCreateOperation: jest.Mock = On(operationService).get(
    method((mock) => mock.createOperation),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    pixInfractionRefundOperationRepository =
      new PixInfractionRefundOperationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleDepositReceivedEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create new pix infraction refund operation successfully.', async () => {
        const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            state: PixDepositState.RECEIVED,
          },
        );

        const originalOperation =
          await OperationFactory.create<OperationEntity>(OperationEntity.name, {
            beneficiary: pixDeposit.user,
            state: OperationState.ACCEPTED,
            value: 1000,
          });

        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationModel>(
          PixInfractionRefundOperationModel.name,
          {
            userId: pixDeposit.user.uuid,
            state: PixInfractionRefundOperationState.OPEN,
            refundOperationValue: 500,
            originalOperation,
          },
        );

        mockGetOperationById.mockResolvedValueOnce(null);
        mockGetOperationById.mockResolvedValueOnce(originalOperation);

        const message: HandleCreatePixInfractionRefundOperationEventRequest = {
          refundOperationId: uuidV4(),
          id: pixDeposit.id,
          state: pixDeposit.state,
          userId: pixDeposit.user.uuid,
          walletId: pixDeposit.wallet.uuid,
          amount: pixDeposit.amount,
        };

        await controller.handleDepositReceivedEvent(
          message,
          pixInfractionRefundOperationRepository,
          operationService,
          logger,
        );

        expect(mockGetOperationById).toHaveBeenCalledTimes(2);
        expect(mockCreateOperation).toHaveBeenCalledTimes(1);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should not create if user is not associated to any open pix infraction.', async () => {
        const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            state: PixDepositState.RECEIVED,
          },
        );

        const message: HandleCreatePixInfractionRefundOperationEventRequest = {
          refundOperationId: uuidV4(),
          id: pixDeposit.id,
          state: pixDeposit.state,
          userId: pixDeposit.user.uuid,
          walletId: pixDeposit.wallet.uuid,
          amount: pixDeposit.amount,
        };

        await controller.handleDepositReceivedEvent(
          message,
          pixInfractionRefundOperationRepository,
          operationService,
          logger,
        );

        expect(mockGetOperationById).toHaveBeenCalledTimes(0);
        expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
