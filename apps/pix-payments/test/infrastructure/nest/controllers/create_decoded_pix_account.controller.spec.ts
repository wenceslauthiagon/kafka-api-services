import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { cpf } from 'cpf-cnpj-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { OnboardingStatus, PersonType, UserEntity } from '@zro/users/domain';
import { BankEntity } from '@zro/banking/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  DecodedPixAccountEntity,
  DecodedPixAccountRepository,
} from '@zro/pix-payments/domain';
import {
  CreateDecodedPixAccountMicroserviceController as Controller,
  UserServiceKafka,
  BankingServiceKafka,
  DecodedPixAccountDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  CreateDecodedPixAccountRequest,
  DecodedPixAccountEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  KycGateway,
  BankNotFoundException,
  DecodedPixAccountOwnedByUserException,
  KYCNotFoundException,
} from '@zro/pix-payments/application';
import { UserFactory } from '@zro/test/users/config';
import { BankFactory } from '@zro/test/banking/config';
import { DecodedPixAccountFactory } from '@zro/test/pix-payments/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateDecodeQrCodeMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let decodedPixAccountRepository: DecodedPixAccountRepository;

  const ZRO_BANK_ISPB = '26264220';

  const eventEmitter: DecodedPixAccountEventEmitterControllerInterface =
    createMock<DecodedPixAccountEventEmitterControllerInterface>();
  const mockEmitDecodedPixAccountEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDecodedPixAccountEvent),
  );

  const kycGatewayMock: KycGateway = createMock<KycGateway>();
  const mockGetKycInfoGateway: jest.Mock = On(kycGatewayMock).get(
    method((mock) => mock.getKycInfo),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByCpfAndStatusIsFinished),
  );

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankByIspbService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    decodedPixAccountRepository = new DecodedPixAccountDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('DecodePixAccount', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create a decoded Pix Account successfully and decode it', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const bank = await BankFactory.create<BankEntity>(BankEntity.name);
        const decoded =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
            { user },
          );

        mockGetUserByUuidService.mockResolvedValueOnce(null);
        mockGetBankByIspbService.mockResolvedValueOnce(bank);
        mockGetKycInfoGateway.mockResolvedValueOnce({
          name: 'any_name',
          props: {},
        });

        const message: CreateDecodedPixAccountRequest = {
          id: decoded.id,
          userId: decoded.user.uuid,
          personType: decoded.personType,
          bankIspb: decoded.bank.ispb,
          branch: decoded.branch,
          accountNumber: decoded.accountNumber,
          accountType: decoded.accountType,
          document: decoded.document,
        };

        const result = await controller.execute(
          decodedPixAccountRepository,
          eventEmitter,
          logger,
          userService,
          bankingService,
          kycGatewayMock,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should not get the created decodedPixAccount if bank not found', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const bank = await BankFactory.create<BankEntity>(BankEntity.name);
        const decoded =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
            { user, bank },
          );

        mockGetUserByUuidService.mockResolvedValueOnce(user);
        mockGetBankByIspbService.mockResolvedValueOnce(null);

        const message: CreateDecodedPixAccountRequest = {
          id: decoded.id,
          userId: decoded.user.uuid,
          personType: decoded.personType,
          bankIspb: decoded.bank.ispb,
          branch: decoded.branch,
          accountNumber: decoded.accountNumber,
          accountType: decoded.accountType,
          document: decoded.document,
        };

        const testScript = () =>
          controller.execute(
            decodedPixAccountRepository,
            eventEmitter,
            logger,
            userService,
            bankingService,
            kycGatewayMock,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(BankNotFoundException);
        expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - should not get the created decodedPixAccount if user decode self account', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
          ispb: ZRO_BANK_ISPB,
        });
        const decoded =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
            { user, bank },
          );

        mockGetUserByUuidService.mockResolvedValueOnce({
          id: uuidV4(),
          user,
          status: OnboardingStatus.FINISHED,
          fullName: user.fullName,
        });
        mockGetBankByIspbService.mockResolvedValueOnce(bank);

        const message: CreateDecodedPixAccountRequest = {
          id: decoded.id,
          userId: decoded.user.uuid,
          personType: PersonType.NATURAL_PERSON,
          bankIspb: decoded.bank.ispb,
          branch: decoded.branch,
          accountNumber: decoded.accountNumber,
          accountType: decoded.accountType,
          document: cpf.generate(),
        };

        const testScript = () =>
          controller.execute(
            decodedPixAccountRepository,
            eventEmitter,
            logger,
            userService,
            bankingService,
            kycGatewayMock,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          DecodedPixAccountOwnedByUserException,
        );
        expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - should not get the created decodedPixAccount if KycInfo not found', async () => {
        const bank = await BankFactory.create<BankEntity>(BankEntity.name);
        const decoded =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
            { bank },
          );

        mockGetUserByUuidService.mockResolvedValueOnce(null);
        mockGetBankByIspbService.mockResolvedValueOnce(bank);
        mockGetKycInfoGateway.mockResolvedValueOnce(null);

        const message: CreateDecodedPixAccountRequest = {
          id: decoded.id,
          userId: decoded.user.uuid,
          personType: decoded.personType,
          bankIspb: decoded.bank.ispb,
          branch: decoded.branch,
          accountNumber: decoded.accountNumber,
          accountType: decoded.accountType,
          document: decoded.document,
        };

        const testScript = () =>
          controller.execute(
            decodedPixAccountRepository,
            eventEmitter,
            logger,
            userService,
            bankingService,
            kycGatewayMock,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(KYCNotFoundException);
        expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
