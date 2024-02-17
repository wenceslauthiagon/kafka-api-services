import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  ReceiptPortugueseTranslation,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { ReceiptEntity } from '@zro/operations/domain';
import {
  WalletAccountModel,
  GetOperationReceiptByUserAndWalletAndIdMicroserviceController as Controller,
  OperationDatabaseRepository,
  OperationModel,
  WalletModel,
  WalletAccountCacheDatabaseRepository,
  UserServiceKafka,
  PixPaymentsServiceKafka,
  BankingServiceKafka,
  TransactionTypeModel,
  OtcServiceKafka,
  UserWalletDatabaseRepository,
  UserWalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { GetOperationReceiptByUserAndWalletAndIdRequest } from '@zro/operations/interface';
import {
  OperationFactory,
  TransactionTypeFactory,
  UserWalletFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('GetOperationReceiptByUserAndWalletAndIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const operationRepository = new OperationDatabaseRepository();
  const walletAccountCacheRepository =
    new WalletAccountCacheDatabaseRepository();
  const userWalletRepository = new UserWalletDatabaseRepository();

  const userService: UserServiceKafka = createMock<UserServiceKafka>();

  const pixPaymentsService: PixPaymentsServiceKafka =
    createMock<PixPaymentsServiceKafka>();
  const mockGetPaymentReceiptService: jest.Mock = On(pixPaymentsService).get(
    method((mock) => mock.getPaymentReceipt),
  );

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();

  const otcService: OtcServiceKafka = createMock<OtcServiceKafka>();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetOperationReceiptByUserAndWalletAndId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to get operation receipt successfully', async () => {
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );

        await UserWalletFactory.create<UserWalletModel>(UserWalletModel.name, {
          wallet: wallet,
          walletId: wallet.uuid,
          userId: wallet.userUUID,
        });

        const user = new UserEntity({ uuid: wallet.userUUID });
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
            { walletUUID: wallet.uuid, walletId: wallet.id },
          );

        await OperationFactory.createMany<OperationModel>(
          OperationModel.name,
          2,
          { ownerWalletAccountId: walletAccount.id },
        );

        const transactionType =
          await TransactionTypeFactory.create<TransactionTypeModel>(
            TransactionTypeModel.name,
            {
              tag: 'PIXSEND',
            },
          );

        const operation = await OperationFactory.create<OperationModel>(
          OperationModel.name,
          {
            ownerWalletAccountId: 0,
            beneficiaryWalletAccountId: walletAccount.id,
            transactionTypeId: transactionType.id,
          },
        );

        mockGetPaymentReceiptService.mockResolvedValue(
          new ReceiptEntity({
            paymentData: [],
            paymentTitle: ReceiptPortugueseTranslation.pixSent,
            operationId: operation.id,
          }),
        );

        const message: GetOperationReceiptByUserAndWalletAndIdRequest = {
          userId: user.uuid,
          walletId: wallet.uuid,
          id: operation.id,
        };

        const result = await controller.execute(
          operationRepository,
          walletAccountCacheRepository,
          userWalletRepository,
          pixPaymentsService,
          userService,
          bankingService,
          otcService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.operationId).toBe(operation.id);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
