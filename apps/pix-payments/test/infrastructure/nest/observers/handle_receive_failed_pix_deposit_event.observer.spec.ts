import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  ReceiveFailedPixDepositNestObserver as Observer,
  BankingServiceKafka,
  PixDepositDatabaseRepository,
  PixDepositModel,
  UserServiceKafka,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDepositEventEmitterControllerInterface,
  PixDepositEventType,
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionEventType,
  ReceivePixDepositRequest,
} from '@zro/pix-payments/interface';
import { PixDepositFactory } from '@zro/test/pix-payments/config';
import { BankFactory } from '@zro/test/banking/config';

const APP_ZROBANK_ISPB = '26264220';

describe('ReceiveFailedPixDepositNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixDepositRepository: PixDepositRepository;

  const eventEmitter: PixDepositEventEmitterControllerInterface =
    createMock<PixDepositEventEmitterControllerInterface>();
  const mockEmitPixDepositEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDepositEvent),
  );

  const devolutionEventEmitter: PixDevolutionEventEmitterControllerInterface =
    createMock<PixDevolutionEventEmitterControllerInterface>();
  const mockEmitPixDevolutionEvent: jest.Mock = On(devolutionEventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankingService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = module.get<Observer>(Observer);
    pixDepositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if deposit already exists', async () => {
      const data = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        {
          state: PixDepositState.NEW,
          clientBankIspb: APP_ZROBANK_ISPB,
          thirdPartBankIspb: APP_ZROBANK_ISPB,
          thirdPartDocument: cpf.generate(),
          clientDocument: cpf.generate(),
        },
      );

      const message: ReceivePixDepositRequest = {
        id: data.id,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBankIspb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBankIspb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };

      await controller.execute(
        message,
        pixDepositRepository,
        eventEmitter,
        devolutionEventEmitter,
        bankingService,
        userService,
        logger,
      );

      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockEmitPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw InvalidDataFormatException when missing params', async () => {
      const data = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        {
          state: PixDepositState.NEW,
          clientBankIspb: APP_ZROBANK_ISPB,
          thirdPartBankIspb: APP_ZROBANK_ISPB,
          thirdPartDocument: cpf.generate(),
          clientDocument: cpf.generate(),
        },
      );

      const message: ReceivePixDepositRequest = {
        id: null,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBankIspb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBankIspb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixDepositRepository,
          eventEmitter,
          devolutionEventEmitter,
          bankingService,
          userService,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockEmitPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create new received deposit successfully, start its checks, and emit new deposit', async () => {
      const zrobank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: APP_ZROBANK_ISPB,
      });

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank: zrobank,
          thirdPartBank: zrobank,
          thirdPartDocument: cpf.generate(),
          clientDocument: cpf.generate(),
        },
      );

      const message: ReceivePixDepositRequest = {
        id: data.id,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBank.ispb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBank.ispb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };

      mockGetBankingService.mockResolvedValue(zrobank);

      await controller.execute(
        message,
        pixDepositRepository,
        eventEmitter,
        devolutionEventEmitter,
        bankingService,
        userService,
        logger,
      );

      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDepositEvent.mock.calls[0][0]).toBe(
        PixDepositEventType.RECEIVED_FAILED,
      );
      expect(mockEmitPixDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDevolutionEvent.mock.calls[0][0]).toBe(
        PixDevolutionEventType.CREATE_FAILED,
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
