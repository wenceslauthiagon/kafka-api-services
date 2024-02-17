import { faker } from '@faker-js/faker';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  BankAccountEntity,
  BankAccountRepository,
  ClientEntity,
  ClientRepository,
  CompanyEntity,
  CompanyPolicyEntity,
  CompanyPolicyRepository,
  CompanyRepository,
  PlanEntity,
  PlanRepository,
  QrCodeEntity,
  QrCodeRepository,
} from '@zro/pix-zro-pay/domain';
import {
  BankAccountGatewayNotFoundException,
  BankAccountNotFoundException,
  CompanyNotFoundException,
  CompanyPolicyNotFoundException,
  CompanyWithoutActiveBankCashInException,
  PixPaymentGateway,
  PlanNotFoundException,
  QrCodeEventEmitter,
  QrCodeInvalidValueException,
  QrCodeNotGeneratedException,
  CreateQrCodeUseCase as UseCase,
} from '@zro/pix-zro-pay/application';
import {
  BankAccountFactory,
  ClientFactory,
  CompanyPolicyFactory,
  PlanFactory,
  CompanyFactory,
  QrCodeFactory,
} from '@zro/test/pix-zro-pay/config';
import * as MockGatewayCreateQrCode from '@zro/test/pix-zro-pay/config/mocks/create_qr_code_pix_payment.mock';
import * as MockGatewayGetQrCodeById from '@zro/test/pix-zro-pay/config/mocks/get_qr_code_by_id_pix_payment.mock';
import * as MockGatewayGetProviderName from '@zro/test/pix-zro-pay/config/mocks/get_provider_name_pix_payment.mock';

describe('CreateQrCodeUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = async () => {
    const {
      companyRepository,
      mockGetCompanyRepository,
      clientRepository,
      mockGetClientRepository,
      bankAccountRepository,
      mockGetBankAccountRepository,
      companyPolicyRepository,
      mockGetCompanyPolicyRepository,
      planRepository,
      mockGetPlanRepository,
      qrCodeRepository,
      mockCreateQrCodeRepository,
    } = await mockRepository();

    const { bankAccount, client, company, companyPolicy, plan, qrCode } =
      await mockModel();
    const {
      pixPaymentGateway,
      mockCreateQrCodePixPaymentGateway,
      mockGetProviderNamePixPaymentGateway,
      mockGetQrCodeByIdPixPaymentGateway,
    } = mockPaymentGateway();

    const eventEmitter: QrCodeEventEmitter = createMock<QrCodeEventEmitter>();

    const sut = new UseCase(
      logger,
      bankAccountRepository,
      clientRepository,
      companyRepository,
      companyPolicyRepository,
      planRepository,
      qrCodeRepository,
      [pixPaymentGateway],
      eventEmitter,
      100,
    );

    return {
      sut,
      companyRepository,
      mockGetCompanyRepository,
      clientRepository,
      mockGetClientRepository,
      bankAccountRepository,
      mockGetBankAccountRepository,
      companyPolicyRepository,
      mockGetCompanyPolicyRepository,
      planRepository,
      mockGetPlanRepository,
      qrCodeRepository,
      mockCreateQrCodeRepository,
      mockCreateQrCodePixPaymentGateway,
      mockGetProviderNamePixPaymentGateway,
      mockGetQrCodeByIdPixPaymentGateway,
      bankAccount,
      client,
      company,
      companyPolicy,
      plan,
      qrCode,
    };
  };

  const mockRepository = async () => {
    const { bankAccount, client, company, companyPolicy, plan, qrCode } =
      await mockModel();

    const companyRepository: CompanyRepository =
      createMock<CompanyRepository>();
    const mockGetCompanyRepository: jest.Mock = On(companyRepository)
      .get(method((mock) => mock.getById))
      .mockResolvedValue(company);

    const clientRepository: ClientRepository = createMock<ClientRepository>();
    const mockGetClientRepository: jest.Mock = On(clientRepository)
      .get(method((mock) => mock.getByDocumentAndCompany))
      .mockResolvedValue(client);

    const bankAccountRepository: BankAccountRepository =
      createMock<BankAccountRepository>();
    const mockGetBankAccountRepository: jest.Mock = On(bankAccountRepository)
      .get(method((mock) => mock.getById))
      .mockResolvedValue(bankAccount);

    const companyPolicyRepository: CompanyPolicyRepository =
      createMock<CompanyPolicyRepository>();
    const mockGetCompanyPolicyRepository: jest.Mock = On(
      companyPolicyRepository,
    )
      .get(method((mock) => mock.getByCompany))
      .mockResolvedValue(companyPolicy);

    const planRepository: PlanRepository = createMock<PlanRepository>();
    const mockGetPlanRepository: jest.Mock = On(planRepository)
      .get(method((mock) => mock.getById))
      .mockResolvedValue(plan);

    const qrCodeRepository: QrCodeRepository = createMock<QrCodeRepository>();
    const mockCreateQrCodeRepository: jest.Mock = On(qrCodeRepository)
      .get(method((mock) => mock.create))
      .mockResolvedValue(qrCode);

    return {
      companyRepository,
      mockGetCompanyRepository,
      clientRepository,
      mockGetClientRepository,
      bankAccountRepository,
      mockGetBankAccountRepository,
      companyPolicyRepository,
      mockGetCompanyPolicyRepository,
      planRepository,
      mockGetPlanRepository,
      qrCodeRepository,
      mockCreateQrCodeRepository,
    };
  };

  const mockModel = async () => {
    const bankAccount = await BankAccountFactory.create<BankAccountEntity>(
      BankAccountEntity.name,
    );
    const plan = await PlanFactory.create<PlanEntity>(PlanEntity.name);
    const company = await CompanyFactory.create<CompanyEntity>(
      CompanyEntity.name,
      { activeBankForCashIn: bankAccount, plan },
    );
    const client = await ClientFactory.create<ClientEntity>(ClientEntity.name, {
      company,
    });
    const companyPolicy =
      await CompanyPolicyFactory.create<CompanyPolicyEntity>(
        CompanyPolicyEntity.name,
        { company },
      );
    const qrCode = await QrCodeFactory.create<QrCodeEntity>(QrCodeEntity.name, {
      company,
      bankAccount,
      client,
    });

    return {
      bankAccount,
      plan,
      company,
      client,
      qrCode,
      companyPolicy,
    };
  };

  const mockPaymentGateway = () => {
    const pixPaymentGateway: PixPaymentGateway =
      createMock<PixPaymentGateway>();

    const mockCreateQrCodePixPaymentGateway: jest.Mock = On(pixPaymentGateway)
      .get(method((mock) => mock.createQrCode))
      .mockImplementationOnce(MockGatewayCreateQrCode.success);
    const mockGetQrCodeByIdPixPaymentGateway: jest.Mock = On(pixPaymentGateway)
      .get(method((mock) => mock.getQrCodeById))
      .mockImplementationOnce(MockGatewayGetQrCodeById.success);
    const mockGetProviderNamePixPaymentGateway: jest.Mock = On(
      pixPaymentGateway,
    )
      .get(method((mock) => mock.getProviderName))
      .mockImplementationOnce(MockGatewayGetProviderName.success);

    return {
      pixPaymentGateway,
      mockGetProviderNamePixPaymentGateway,
      mockCreateQrCodePixPaymentGateway,
      mockGetQrCodeByIdPixPaymentGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should create qr code successfully', async () => {
      const {
        sut,
        client,
        company,
        bankAccount,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: faker.datatype.number(100),
      };

      const result = await sut.execute(
        fakeMessage.value,
        fakeMessage.description,
        client,
        company,
        fakeMessage.merchantId,
        fakeMessage.expirationInSeconds,
      );

      expect(result).toBeDefined();
      expect(result.bankAccount).toBeDefined();
      expect(result.client).toBeDefined();
      expect(result.company).toBeDefined();
      expect(result.transactionUuid).toBeDefined();
      expect(result.txId).toBeDefined();
      expect(result.emv).toBeDefined();
      expect(result.merchantId).toEqual(fakeMessage.merchantId);
      expect(result.gatewayName).toEqual(bankAccount.name);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not create if missing params', async () => {
      const {
        sut,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      const testScript = () => sut.execute(null, null, null, null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(0);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw error when company is not found', async () => {
      const {
        sut,
        client,
        company,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      mockGetCompanyRepository.mockResolvedValue(undefined);

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: faker.datatype.number(100),
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(CompanyNotFoundException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(0);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw error when company is not an active bank for cash in', async () => {
      const {
        sut,
        client,
        company,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      company.activeBankForCashIn = null;
      mockGetCompanyRepository.mockResolvedValue(company);

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: faker.datatype.number(100),
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(
        CompanyWithoutActiveBankCashInException,
      );
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(0);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw error when plan is not found', async () => {
      const {
        sut,
        client,
        company,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      mockGetPlanRepository.mockResolvedValue(undefined);

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: faker.datatype.number(100),
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(PlanNotFoundException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw error when qr code with invalid value', async () => {
      const {
        sut,
        client,
        company,
        plan,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      plan.qrCodeMinValueInCents = faker.datatype.number({ min: 1, max: 1 });
      plan.qrCodeMaxValueInCents = faker.datatype.number({
        min: 1000,
        max: 1000,
      });

      mockGetPlanRepository.mockResolvedValue(plan);

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: 1000000,
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(QrCodeInvalidValueException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should throw error when bank account is not found', async () => {
      const {
        sut,
        client,
        company,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      mockGetBankAccountRepository.mockResolvedValue(undefined);

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: 100,
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(BankAccountNotFoundException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should throw error when company policy is not found', async () => {
      const {
        sut,
        client,
        company,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      mockGetCompanyPolicyRepository.mockResolvedValue(undefined);

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: 100,
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(CompanyPolicyNotFoundException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should throw error when bank account gateway is not found', async () => {
      const {
        sut,
        client,
        company,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      mockGetProviderNamePixPaymentGateway
        .mockReset()
        .mockImplementationOnce(MockGatewayGetProviderName.notFound);

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: 100,
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(
        BankAccountGatewayNotFoundException,
      );
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(1);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should throw error when QR CODE not generated', async () => {
      const {
        sut,
        client,
        company,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      mockCreateQrCodePixPaymentGateway
        .mockReset()
        .mockReturnValueOnce(Promise.resolve(undefined));

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: 100,
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(QrCodeNotGeneratedException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(1);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should throw error when QR CODE is not found', async () => {
      const {
        sut,
        client,
        company,
        mockCreateQrCodePixPaymentGateway,
        mockGetBankAccountRepository,
        mockGetCompanyPolicyRepository,
        mockGetPlanRepository,
        mockGetProviderNamePixPaymentGateway,
        mockGetQrCodeByIdPixPaymentGateway,
        mockCreateQrCodeRepository,
        mockGetClientRepository,
        mockGetCompanyRepository,
      } = await makeSut();

      mockGetQrCodeByIdPixPaymentGateway
        .mockReset()
        .mockReturnValueOnce(undefined);

      const fakeMessage = {
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: 100,
      };

      const testScript = () =>
        sut.execute(
          fakeMessage.value,
          fakeMessage.description,
          client,
          company,
          fakeMessage.merchantId,
          fakeMessage.expirationInSeconds,
        );

      await expect(testScript).rejects.toThrow(QrCodeNotGeneratedException);
      expect(mockGetCompanyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPlanRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCompanyPolicyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNamePixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodePixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockGetQrCodeByIdPixPaymentGateway).toHaveBeenCalledTimes(1);
      expect(mockGetClientRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeRepository).toHaveBeenCalledTimes(0);
    });
  });
});
