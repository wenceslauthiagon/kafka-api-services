import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { BankEntity } from '@zro/banking/domain';
import {
  DecodedQrCodeEntity,
  DecodedQrCodeRepository,
  DecodedQrCodeState,
} from '@zro/pix-payments/domain';
import {
  CreateDecodedQrCodeUseCase as UseCase,
  DecodedQrCodeEventEmitter,
  PixPaymentGateway,
  BankingService,
  BankNotFoundException,
  UserService,
} from '@zro/pix-payments/application';
import { UserNotFoundException } from '@zro/users/application';
import * as DecodedQrCodePspGatewayMock from '@zro/test/pix-payments/config/mocks/decode_qr_code.mock';

describe('CreateDecodedQrCodeUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const userService: UserService = createMock<UserService>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const eventEmitter: DecodedQrCodeEventEmitter =
    createMock<DecodedQrCodeEventEmitter>();
  const mockReadyDecodedQrCodeEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.readyDecodedQrCode),
  );

  const decodedQrCodeRepositoryMock: DecodedQrCodeRepository =
    createMock<DecodedQrCodeRepository>();
  const mockGetDecodedQrCodeById: jest.Mock = On(
    decodedQrCodeRepositoryMock,
  ).get(method((mock) => mock.getById));
  const mockCreateDecodedQrCode: jest.Mock = On(
    decodedQrCodeRepositoryMock,
  ).get(method((mock) => mock.create));

  const pixPaymentGatewayMock: PixPaymentGateway =
    createMock<PixPaymentGateway>();
  const mockDecodeQrCodeGateway: jest.Mock = On(pixPaymentGatewayMock).get(
    method((mock) => mock.decodeQrCode),
  );

  const bankingServiceMock: BankingService = createMock<BankingService>();
  const mockGetBankByIspbService: jest.Mock = On(bankingServiceMock).get(
    method((mock) => mock.getBankByIspb),
  );

  describe('With valid parameters', () => {
    it('TC0001 - Should create a decoded qr code successfully and decode it', async () => {
      const user = new UserEntity({
        uuid: faker.datatype.uuid(),
        active: true,
      });
      const bank = new BankEntity({
        name: faker.datatype.string(),
        ispb: faker.datatype.string(),
      });

      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetBankByIspbService.mockResolvedValue(bank);
      mockCreateDecodedQrCode.mockImplementation((body) => body);

      mockDecodeQrCodeGateway.mockImplementationOnce(
        DecodedQrCodePspGatewayMock.success,
      );

      const usecase = new UseCase(
        logger,
        decodedQrCodeRepositoryMock,
        eventEmitter,
        pixPaymentGatewayMock,
        userService,
        bankingServiceMock,
      );

      const result = await usecase.execute(
        faker.datatype.uuid(),
        user,
        faker.datatype.string(),
      );

      expect(result).toBeDefined();
      expect(result.state).toBe(DecodedQrCodeState.READY);
      expect(result.recipientBankName).toBe(bank.name);
      expect(result.recipientBankIspb).toBe(bank.ispb);

      expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspbService).toHaveBeenCalledTimes(1);
      expect(mockCreateDecodedQrCode).toHaveBeenCalledTimes(1);

      expect(mockDecodeQrCodeGateway).toHaveBeenCalledTimes(1);
      expect(mockReadyDecodedQrCodeEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should return a decoded qr code successfully if one already exists', async () => {
      const decodedQrCode = new DecodedQrCodeEntity({
        id: faker.datatype.uuid(),
        emv: faker.datatype.string(),
        state: DecodedQrCodeState.PENDING,
        user: new UserEntity({ uuid: faker.datatype.uuid() }),
      });

      mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

      const usecase = new UseCase(
        logger,
        decodedQrCodeRepositoryMock,
        eventEmitter,
        pixPaymentGatewayMock,
        userService,
        bankingServiceMock,
      );

      const result = await usecase.execute(
        decodedQrCode.id,
        decodedQrCode.user,
        decodedQrCode.emv,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();

      expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetBankByIspbService).toHaveBeenCalledTimes(0);

      expect(mockDecodeQrCodeGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyDecodedQrCodeEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not create if existing decoded qr code user is not the current user', async () => {
      const decodedQrCode = new DecodedQrCodeEntity({
        id: faker.datatype.uuid(),
        emv: faker.datatype.string(),
        state: DecodedQrCodeState.PENDING,
        user: new UserEntity({ uuid: faker.datatype.uuid() }),
      });
      const fakeUser = new UserEntity({ uuid: faker.datatype.uuid() });

      mockGetDecodedQrCodeById.mockResolvedValue(decodedQrCode);

      const usecase = new UseCase(
        logger,
        decodedQrCodeRepositoryMock,
        eventEmitter,
        pixPaymentGatewayMock,
        userService,
        bankingServiceMock,
      );

      const testScript = () =>
        usecase.execute(decodedQrCode.id, fakeUser, decodedQrCode.emv);

      await expect(testScript).rejects.toThrow(ForbiddenException);

      expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetBankByIspbService).toHaveBeenCalledTimes(0);

      expect(mockDecodeQrCodeGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyDecodedQrCodeEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create without emv', async () => {
      const fakeUser = new UserEntity({ uuid: faker.datatype.uuid() });

      const usecase = new UseCase(
        logger,
        decodedQrCodeRepositoryMock,
        eventEmitter,
        pixPaymentGatewayMock,
        userService,
        bankingServiceMock,
      );

      const testScript = () =>
        usecase.execute(faker.datatype.uuid(), fakeUser, null);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetBankByIspbService).toHaveBeenCalledTimes(0);

      expect(mockDecodeQrCodeGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyDecodedQrCodeEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if not existing user', async () => {
      const fakeUser = new UserEntity({ uuid: faker.datatype.uuid() });

      const usecase = new UseCase(
        logger,
        decodedQrCodeRepositoryMock,
        eventEmitter,
        pixPaymentGatewayMock,
        userService,
        bankingServiceMock,
      );

      const testScript = () =>
        usecase.execute(
          faker.datatype.uuid(),
          fakeUser,
          faker.datatype.string(),
        );

      await expect(testScript).rejects.toThrow(UserNotFoundException);

      expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspbService).toHaveBeenCalledTimes(0);

      expect(mockDecodeQrCodeGateway).toHaveBeenCalledTimes(0);
      expect(mockReadyDecodedQrCodeEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if not existing bank', async () => {
      const user = new UserEntity({
        uuid: faker.datatype.uuid(),
        active: true,
      });

      mockGetUserByUuidService.mockResolvedValue(user);

      mockDecodeQrCodeGateway.mockImplementationOnce(
        DecodedQrCodePspGatewayMock.success,
      );

      const usecase = new UseCase(
        logger,
        decodedQrCodeRepositoryMock,
        eventEmitter,
        pixPaymentGatewayMock,
        userService,
        bankingServiceMock,
      );

      const testScript = () =>
        usecase.execute(faker.datatype.uuid(), user, faker.datatype.string());

      await expect(testScript).rejects.toThrow(BankNotFoundException);

      expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspbService).toHaveBeenCalledTimes(1);

      expect(mockDecodeQrCodeGateway).toHaveBeenCalledTimes(1);
      expect(mockReadyDecodedQrCodeEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should return a null because the invalid emv', async () => {
      const user = new UserEntity({
        uuid: faker.datatype.uuid(),
        active: true,
      });

      mockGetUserByUuidService.mockResolvedValue(user);
      mockDecodeQrCodeGateway.mockImplementationOnce(
        DecodedQrCodePspGatewayMock.empty,
      );

      const usecase = new UseCase(
        logger,
        decodedQrCodeRepositoryMock,
        eventEmitter,
        pixPaymentGatewayMock,
        userService,
        bankingServiceMock,
      );

      const result = await usecase.execute(
        faker.datatype.uuid(),
        user,
        faker.datatype.uuid(),
      );

      expect(result).toBeNull();

      expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspbService).toHaveBeenCalledTimes(0);

      expect(mockDecodeQrCodeGateway).toHaveBeenCalledTimes(1);
      expect(mockReadyDecodedQrCodeEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
