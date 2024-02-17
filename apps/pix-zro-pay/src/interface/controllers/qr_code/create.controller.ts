import { Logger } from 'winston';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, SanitizeHtml } from '@zro/common';
import {
  BankAccountRepository,
  Client,
  ClientEntity,
  ClientRepository,
  Company,
  CompanyEntity,
  CompanyPolicyRepository,
  CompanyRepository,
  PlanRepository,
  QrCode,
  QrCodeRepository,
} from '@zro/pix-zro-pay/domain';
import {
  PixPaymentGateway,
  CreateQrCodeUseCase as UseCase,
} from '@zro/pix-zro-pay/application';
import {
  QrCodeEventEmitterController,
  QrCodeEventEmitterControllerInterface,
} from '@zro/pix-zro-pay/interface';

type CompanyId = Company['id'];
type ClientName = Client['name'];
type ClientEmail = Client['email'];
type ClientDocument = Client['document'];

type TCreateQrCodeRequest = Pick<QrCode, 'value' | 'description'> & {
  companyId: CompanyId;
  merchantId: string;
  clientDocument: ClientDocument;
  clientName?: ClientName;
  clientEmail?: ClientEmail;
};

export class CreateQrCodeRequest
  extends AutoValidator
  implements TCreateQrCodeRequest
{
  @IsInt()
  @IsPositive()
  value: number;

  @IsInt()
  companyId: CompanyId;

  @IsUUID(4)
  merchantId: string;

  @IsString()
  clientDocument: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(80)
  description?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  expirationInSeconds?: number;

  constructor(props: TCreateQrCodeRequest) {
    super(props);
  }
}

type TCreateQrCodeResponse = Pick<
  QrCode,
  'transactionUuid' | 'emv' | 'txId'
> & {
  merchantId: string;
};

export class CreateQrCodeResponse
  extends AutoValidator
  implements TCreateQrCodeResponse
{
  @IsUUID(4)
  transactionUuid: string;

  @IsString()
  txId: string;

  @IsString()
  emv: string;

  @IsUUID(4)
  merchantId: string;

  constructor(props: TCreateQrCodeResponse) {
    super(props);
  }
}

export class CreateQrCodeController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankAccountRepository: BankAccountRepository,
    clientRepository: ClientRepository,
    companyRepository: CompanyRepository,
    companyPolicyRepository: CompanyPolicyRepository,
    planRepository: PlanRepository,
    qrCodeRepository: QrCodeRepository,
    pspGateways: PixPaymentGateway[],
    serviceQrCodeEventEmitter: QrCodeEventEmitterControllerInterface,
    expirationInSecondsDefault: number,
  ) {
    this.logger = logger.child({ context: CreateQrCodeController.name });

    const qrCodeEventEmitter = new QrCodeEventEmitterController(
      serviceQrCodeEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      bankAccountRepository,
      clientRepository,
      companyRepository,
      companyPolicyRepository,
      planRepository,
      qrCodeRepository,
      pspGateways,
      qrCodeEventEmitter,
      expirationInSecondsDefault,
    );
  }

  async execute(request: CreateQrCodeRequest): Promise<CreateQrCodeResponse> {
    this.logger.debug('Create qrCode request.', { request });

    const {
      value,
      companyId,
      merchantId,
      clientDocument,
      description,
      clientName,
      clientEmail,
      expirationInSeconds,
    } = request;

    const client = new ClientEntity({
      name: clientName,
      email: clientEmail,
      document: clientDocument,
    });
    const company = new CompanyEntity({ id: companyId });

    const qrCode = await this.usecase.execute(
      value,
      description,
      client,
      company,
      merchantId,
      expirationInSeconds,
    );

    if (!qrCode) return null;

    const response = new CreateQrCodeResponse({
      transactionUuid: qrCode.transactionUuid,
      txId: qrCode.txId,
      emv: qrCode.emv,
      merchantId,
    });

    this.logger.info('Create qrCode response.', {
      qrCode: response,
    });

    return response;
  }
}
