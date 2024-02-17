import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException, getMoment } from '@zro/common';
import {
  BankAccountName,
  BankAccountRepository,
  Client,
  ClientEntity,
  ClientRepository,
  Company,
  CompanyPolicyRepository,
  CompanyRepository,
  PlanRepository,
  QrCodeState,
  QrCode,
  QrCodeEntity,
  QrCodeFormat,
  QrCodeRepository,
} from '@zro/pix-zro-pay/domain';
import {
  BankAccountNotFoundException,
  CompanyNotFoundException,
  PlanNotFoundException,
  QrCodeInvalidValueException,
  ClientIsBlacklistedException,
  CompanyPolicyNotFoundException,
  CreateQrCodePixPaymentPspRequest,
  PixPaymentGateway,
  CompanyWithoutActiveBankCashInException,
  BankAccountGatewayNotFoundException,
  QrCodeEventEmitter,
  CreateQrCodePixPaymentPspResponse,
  GetQrCodeByIdPixPaymentPspRequest,
  QrCodeNotGeneratedException,
} from '@zro/pix-zro-pay/application';

export class CreateQrCodeUseCase {
  private readonly TIMEZONE_OFFSET = -3;
  private readonly ttlAdditional = 432000; //in Seconds

  constructor(
    private logger: Logger,
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly clientRepository: ClientRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly companyPolicyRepository: CompanyPolicyRepository,
    private readonly planRepository: PlanRepository,
    private readonly qrCodeRepository: QrCodeRepository,
    private readonly pspGateways: PixPaymentGateway[],
    private readonly qrCodeEventEmitter: QrCodeEventEmitter,
    private readonly expirationInSecondsDefault: number,
  ) {
    this.logger = logger.child({
      context: CreateQrCodeUseCase.name,
    });
  }

  async execute(
    value: number,
    description: string,
    client: Client,
    company: Company,
    merchantId: string,
    expirationInSeconds: number,
  ): Promise<QrCode> {
    // Data input check
    if (!isDefined(value) || !client?.document || !company?.id || !merchantId) {
      throw new MissingDataException([
        ...(!isDefined(value) ? ['Value'] : []),
        ...(!client?.document ? ['Client Document'] : []),
        ...(!company?.id ? ['Company ID'] : []),
        ...(!merchantId ? ['Merchant ID'] : []),
      ]);
    }

    const companyFound = await this.companyRepository.getById(company.id);

    this.logger.debug('Company Found.', { company: companyFound });

    if (!companyFound) {
      throw new CompanyNotFoundException(companyFound);
    }

    if (!companyFound.activeBankForCashIn?.id) {
      throw new CompanyWithoutActiveBankCashInException(companyFound);
    }

    // Check if Client Exists
    let clientFound = await this.clientRepository.getByDocumentAndCompany(
      client.document,
      company,
    );

    this.logger.debug('Client Found.', { clientFound });

    if (!clientFound) {
      const newClient = new ClientEntity({
        document: client.document,
        email: client.email,
        name: client.name,
        company,
      });
      clientFound = await this.clientRepository.create(newClient);
    }

    // Check qrcode is valid for generate
    if (!(await this.checkValueIsValid(value, companyFound))) {
      throw new QrCodeInvalidValueException(value);
    }

    // Check client blocklisted
    if (await this.checkClientBlocklisted(clientFound)) {
      throw new ClientIsBlacklistedException(clientFound);
    }

    const bankAccountFound = await this.bankAccountRepository.getById(
      companyFound.activeBankForCashIn.id,
    );

    this.logger.debug('BankAccount Found.', { bankAccount: bankAccountFound });

    if (!bankAccountFound) {
      throw new BankAccountNotFoundException(bankAccountFound);
    }

    const companyPolicyFound =
      await this.companyPolicyRepository.getByCompany(company);

    this.logger.debug('CompanyPolicy Found.', {
      companyPolicy: companyPolicyFound,
    });

    if (!companyPolicyFound) {
      throw new CompanyPolicyNotFoundException(companyPolicyFound);
    }

    const body: CreateQrCodePixPaymentPspRequest = {
      value,
      expirationSeconds:
        expirationInSeconds ||
        companyPolicyFound.qrcodeExpirationTimeInSeconds ||
        this.expirationInSecondsDefault,
      description:
        description || `${companyFound.tradingName} - ${client?.name}`,
      payerName: clientFound.name,
      company: companyFound,
      bankAccount: bankAccountFound,
      format: QrCodeFormat.PAYLOAD,
    };

    const gateway = this.pspGateways.find(
      (item) => item.getProviderName() === bankAccountFound.name,
    );

    if (!gateway) {
      throw new BankAccountGatewayNotFoundException({
        name: bankAccountFound.name,
      });
    }

    const pspResult = await gateway.createQrCode(body);

    this.logger.debug('Created qr code in psp', { pspResult });

    if (!pspResult) {
      throw new QrCodeNotGeneratedException({ company });
    }

    if (
      bankAccountFound.name === BankAccountName.BANK_ZRO_BANK &&
      !(await this.validateQrCodeGenerated(pspResult, gateway))
    ) {
      throw new QrCodeNotGeneratedException({
        txId: pspResult.txId,
      });
    }

    const qrCode = new QrCodeEntity({
      transactionUuid: uuidV4(),
      txId: pspResult.txId,
      description: body.description,
      emv: pspResult.emv,
      expirationDate: pspResult.expirationDate,
      value: body.value,
      company: companyFound,
      bankAccount: bankAccountFound,
      client: clientFound,
      merchantId,
      createdAt: getMoment().utcOffset(this.TIMEZONE_OFFSET).toDate(),
      gatewayName: bankAccountFound.name,
    });

    const ttlQrCode = (body.expirationSeconds + this.ttlAdditional) * 1000; //in Miliseconds

    // Create in cache
    await this.qrCodeRepository.create(qrCode, ttlQrCode);

    // Send event ready qrCode
    this.qrCodeEventEmitter.readyQrCode(qrCode);

    return qrCode;
  }

  private async checkValueIsValid(
    value: number,
    company: Company,
  ): Promise<boolean> {
    const planFound = await this.planRepository.getById(company.plan?.id);

    this.logger.debug('Plan found', { plan: planFound });

    if (!planFound) {
      throw new PlanNotFoundException(planFound);
    }

    const { qrCodeMinValueInCents, qrCodeMaxValueInCents } = planFound;

    return (
      (!qrCodeMinValueInCents || qrCodeMinValueInCents <= value) &&
      (!qrCodeMaxValueInCents || qrCodeMaxValueInCents >= value)
    );
  }

  // TODO: For now it will always be false, awaiting table development for blocklist query
  private async checkClientBlocklisted(client: Client): Promise<boolean> {
    this.logger.debug('Check client for blocklist', client);
    return false;
  }

  private async validateQrCodeGenerated(
    pspResult: CreateQrCodePixPaymentPspResponse,
    gateway: PixPaymentGateway,
  ): Promise<boolean> {
    const params: GetQrCodeByIdPixPaymentPspRequest = {
      id: pspResult.id,
    };

    const result = await gateway.getQrCodeById(params);

    this.logger.debug('Get qr code by id psp found', { pspResult: result });

    if (result?.state !== QrCodeState.READY) {
      return false;
    }
    return true;
  }
}
