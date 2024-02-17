import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import axios from 'axios';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  CryptoReportRepository,
  CryptoReportFormatType,
} from '@zro/otc/domain';
import { UserEntity } from '@zro/users/domain';
import { FileEntity } from '@zro/storage/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  StorageService,
  HistoricalCryptoPriceGateway,
} from '@zro/otc/application';
import {
  GetCryptoReportByCurrencyAndFormatMicroserviceController as Controller,
  CryptoReportDatabaseRepository,
  CryptoReportModel,
  UserServiceKafka,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { GetCryptoReportByCurrencyAndFormatRequest } from '@zro/otc/interface';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CryptoReportFactory } from '@zro/test/otc/config';
import { UserFactory } from '@zro/test/users/config';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetCryptoReportByCurrencyAndFormatMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let cryptoReportRepository: CryptoReportRepository;

  const storageService: StorageService = createMock<StorageService>();
  const mockUploadFile: jest.Mock = On(storageService).get(
    method((mock) => mock.uploadFile),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuid: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();

  const historicalCryptoPriceGateway: HistoricalCryptoPriceGateway =
    createMock<HistoricalCryptoPriceGateway>();
  const mockGetHistoricalCryptoPrice: jest.Mock = On(
    historicalCryptoPriceGateway,
  ).get(method((mock) => mock.getHistoricalCryptoPrice));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    cryptoReportRepository = new CryptoReportDatabaseRepository();
  });

  beforeEach(() => mockUploadFile.mockReset());

  describe('With valid parameters', () => {
    it('TC0001 - Should be able to generate crypto report successfully', async () => {
      const { userId, cryptoId } =
        await CryptoReportFactory.create<CryptoReportModel>(
          CryptoReportModel.name,
          {
            cryptoPrice: faker.datatype.number({ min: 1000000, max: 10000000 }),
          },
        );

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        uuid: userId,
      });

      const crypto = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: cryptoId, symbol: faker.lorem.words(1).toUpperCase() },
      );

      const fileId = faker.datatype.uuid();

      const file = new FileEntity({
        id: fileId,
        fileName: `${fileId}-random-filename.pdf`,
        createdAt: new Date(),
      });

      const gatewayResponse = {
        estimatedPrice: faker.datatype.number(100000),
      };

      mockGetUserByUuid.mockResolvedValue(user);
      mockGetCurrencyBySymbol.mockResolvedValue(crypto);
      mockGetHistoricalCryptoPrice.mockResolvedValue(gatewayResponse);
      mockUploadFile.mockResolvedValue(file);

      const message: GetCryptoReportByCurrencyAndFormatRequest = {
        userId: user.uuid,
        format: CryptoReportFormatType.PDF,
        currencySymbol: crypto.symbol,
      };

      const result = await controller.execute(
        logger,
        message,
        storageService,
        userService,
        operationService,
        quotationService,
        cryptoReportRepository,
        historicalCryptoPriceGateway,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(mockUploadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not be able to generate crypto report with missing params', async () => {
      const { userId, cryptoId } =
        await CryptoReportFactory.create<CryptoReportModel>(
          CryptoReportModel.name,
        );

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        uuid: userId,
      });

      const crypto = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: cryptoId },
      );

      const fileId = faker.datatype.uuid();

      const file = new FileEntity({
        id: fileId,
        fileName: `${fileId}-random-filename.pdf`,
        createdAt: new Date(),
      });

      const gatewayResponse = {
        estimatedPrice: faker.datatype.number(100000),
      };

      mockGetUserByUuid.mockResolvedValue(user);
      mockGetCurrencyBySymbol.mockResolvedValue(crypto);
      mockGetHistoricalCryptoPrice.mockResolvedValue(gatewayResponse);
      mockUploadFile.mockResolvedValue(file);

      const message: GetCryptoReportByCurrencyAndFormatRequest = {
        userId: user.uuid,
        format: CryptoReportFormatType.PDF,
        currencySymbol: null,
      };

      const testScript = () =>
        controller.execute(
          logger,
          message,
          storageService,
          userService,
          operationService,
          quotationService,
          cryptoReportRepository,
          historicalCryptoPriceGateway,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockUploadFile).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
