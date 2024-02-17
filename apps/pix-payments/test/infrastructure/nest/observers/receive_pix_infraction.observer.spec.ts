import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixTransactionNotFoundException } from '@zro/pix-payments/application';
import {
  PixInfractionRepository,
  PixDevolutionReceivedRepository,
  PixDepositRepository,
  PixInfractionEntity,
  PixDepositEntity,
  PixInfractionTransactionType,
  PixInfractionStatus,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  ReceivePixInfractionNestObserver as Observer,
  OperationServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  PixInfractionEventEmitterControllerInterface,
  HandleReceivePixInfractionEventRequest,
} from '@zro/pix-payments/interface';
import {
  InfractionFactory,
  PixDepositFactory,
} from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';

describe('ReceiveInfractionNestReceivePixInfractionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const infractionRepository: PixInfractionRepository =
    createMock<PixInfractionRepository>();
  const mockCreateInfractionRepository: jest.Mock = On(
    infractionRepository,
  ).get(method((mock) => mock.create));
  const mockGetInfractionByIdRepository: jest.Mock = On(
    infractionRepository,
  ).get(method((mock) => mock.getByInfractionPspId));

  const depositRepository: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockGetDepositByIdOrEndToEndIdRepository: jest.Mock = On(
    depositRepository,
  ).get(method((mock) => mock.getByIdOrEndToEndId));

  const devolutionReceivedRepository: PixDevolutionReceivedRepository =
    createMock<PixDevolutionReceivedRepository>();
  const mockGetDevolutionReceivedByIdOrEndToEndIdRepository: jest.Mock = On(
    devolutionReceivedRepository,
  ).get(method((mock) => mock.getById));

  const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
    createMock<PixInfractionRefundOperationRepository>();

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ReceiveInfraction', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create infraction successfully', async () => {
        const infraction = await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
          {
            transactionType: PixInfractionTransactionType.DEPOSIT,
            status: PixInfractionStatus.ACKNOWLEDGED,
          },
        );

        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );

        mockGetInfractionByIdRepository.mockResolvedValueOnce(null);
        mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValueOnce(deposit);

        const reportDetails = 'test';
        const {
          id,
          infractionPspId,
          infractionType,
          status,
          ispbDebitedParticipant,
          ispbCreditedParticipant,
          isReporter,
          reportBy,
          ispb,
          endToEndId,
          creationDate,
          lastChangeDate,
        } = infraction;

        const message: HandleReceivePixInfractionEventRequest = {
          id,
          operationTransactionId: deposit.id,
          reportDetails,
          infractionPspId,
          infractionType,
          status,
          ispbDebitedParticipant,
          ispbCreditedParticipant,
          reportBy,
          ispb,
          endToEndId,
          creationDate,
          lastChangeDate,
          isReporter,
        };

        await controller.execute(
          infractionRepository,
          depositRepository,
          devolutionReceivedRepository,
          pixInfractionRefundOperationRepository,
          eventEmitter,
          operationService,
          logger,
          message,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should create infraction successfully when operationTransactionId is missing', async () => {
        const infraction = await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
          {
            transactionType: PixInfractionTransactionType.DEPOSIT,
            status: PixInfractionStatus.ACKNOWLEDGED,
          },
        );

        const deposit = await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
        );

        mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValueOnce(deposit);

        const reportDetails = 'test';
        const {
          id,
          infractionPspId,
          infractionType,
          status,
          ispbDebitedParticipant,
          ispbCreditedParticipant,
          isReporter,
          reportBy,
          ispb,
          endToEndId,
          creationDate,
          lastChangeDate,
        } = infraction;

        const message: HandleReceivePixInfractionEventRequest = {
          id,
          operationTransactionId: null,
          reportDetails,
          infractionPspId,
          infractionType,
          status,
          ispbDebitedParticipant,
          ispbCreditedParticipant,
          reportBy,
          ispb,
          endToEndId,
          creationDate,
          lastChangeDate,
          isReporter,
        };

        await controller.execute(
          infractionRepository,
          depositRepository,
          devolutionReceivedRepository,
          pixInfractionRefundOperationRepository,
          eventEmitter,
          operationService,
          logger,
          message,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not create with invalid id', async () => {
        const reportDetails = 'test';
        const {
          transaction,
          infractionPspId,
          infractionType,
          status,
          ispbDebitedParticipant,
          ispbCreditedParticipant,
          isReporter,
          reportBy,
          ispb,
          endToEndId,
          creationDate,
          lastChangeDate,
        } = await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );

        const message: HandleReceivePixInfractionEventRequest = {
          id: null,
          operationTransactionId: transaction.id,
          reportDetails,
          infractionPspId,
          infractionType,
          status,
          ispbDebitedParticipant,
          ispbCreditedParticipant,
          reportBy,
          ispb,
          endToEndId,
          creationDate,
          lastChangeDate,
          isReporter,
        };

        const testScript = () =>
          controller.execute(
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
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not create if transaction does not exist', async () => {
        const infraction = await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
          { status: PixInfractionStatus.ACKNOWLEDGED },
        );

        mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValueOnce(null);
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository.mockResolvedValueOnce(
          null,
        );

        mockGetInfractionByIdRepository.mockResolvedValueOnce(null);
        mockCreateInfractionRepository.mockResolvedValueOnce((body) => body);

        const reportDetails = 'test';
        const {
          id,
          infractionPspId,
          infractionType,
          status,
          transaction,
          ispbDebitedParticipant,
          ispbCreditedParticipant,
          isReporter,
          reportBy,
          ispb,
          endToEndId,
          creationDate,
          lastChangeDate,
        } = infraction;

        const message: HandleReceivePixInfractionEventRequest = {
          id,
          operationTransactionId: transaction.id,
          reportDetails,
          infractionPspId,
          infractionType,
          status,
          ispbDebitedParticipant,
          ispbCreditedParticipant,
          reportBy,
          ispb,
          endToEndId,
          creationDate,
          lastChangeDate,
          isReporter,
        };

        const testScript = () =>
          controller.execute(
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
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
