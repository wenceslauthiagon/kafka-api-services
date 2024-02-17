import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { BankEntity } from '@zro/banking/domain';
import {
  DecodedQrCodeRepository,
  DecodedQrCodeState,
} from '@zro/pix-payments/domain';
import { UserNotFoundException } from '@zro/users/application';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  CreateDecodedQrCodeMicroserviceController as Controller,
  UserServiceKafka,
  BankingServiceKafka,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  CreateDecodedQrCodeRequest,
  DecodeQrCodeEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import * as DecodedQrCodePspGatewayMock from '@zro/test/pix-payments/config/mocks/decode_qr_code.mock';

describe('CreateDecodeQrCodeMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const eventEmitter: DecodeQrCodeEventEmitterControllerInterface =
    createMock<DecodeQrCodeEventEmitterControllerInterface>();
  const mockEmitDecodedQrCodeEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDecodedQrCodeEvent),
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

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankByIspbService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('DecodeQrCode', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create a decoded QR Code successfully and decode it', async () => {
        const user = new UserEntity({
          uuid: faker.datatype.uuid(),
          document: '12312312312',
          active: true,
        });
        const bank = new BankEntity({
          name: faker.datatype.string(),
          ispb: faker.datatype.string(),
        });

        mockGetUserByUuidService.mockResolvedValue(user);
        mockGetBankByIspbService.mockResolvedValue(bank);
        mockCreateDecodedQrCode.mockImplementation((body) => ({
          ...body,
          createdAt: new Date(),
        }));

        mockDecodeQrCodeGateway.mockImplementationOnce(
          DecodedQrCodePspGatewayMock.success,
        );

        const message: CreateDecodedQrCodeRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          emv: faker.datatype.uuid(),
        };

        const result = await controller.execute(
          logger,
          decodedQrCodeRepositoryMock,
          eventEmitter,
          pixPaymentGatewayMock,
          userService,
          bankingService,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.state).toBe(DecodedQrCodeState.READY);

        expect(mockGetDecodedQrCodeById).toHaveBeenCalledTimes(1);
        expect(mockEmitDecodedQrCodeEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should not get the created decodedQrCode if user is not found', async () => {
        mockGetUserByUuidService.mockResolvedValue(null);
        const userId = faker.datatype.uuid();

        const message: CreateDecodedQrCodeRequest = {
          id: faker.datatype.uuid(),
          emv: faker.datatype.uuid(),
          userId,
        };

        const testScript = () =>
          controller.execute(
            logger,
            decodedQrCodeRepositoryMock,
            eventEmitter,
            pixPaymentGatewayMock,
            userService,
            bankingService,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(UserNotFoundException);
        expect(mockEmitDecodedQrCodeEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
