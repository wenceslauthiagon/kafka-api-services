import { Logger } from 'winston';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Length,
  ValidateIf,
  IsString,
  MaxLength,
} from 'class-validator';
import { AutoValidator, isCpf, isCnpj } from '@zro/common';
import { User, UserEntity, PersonType } from '@zro/users/domain';
import {
  AccountType,
  DecodedPixAccountRepository,
  DecodedPixAccount,
  PaymentType,
} from '@zro/pix-payments/domain';
import { Bank, BankEntity } from '@zro/banking/domain';
import {
  BankingService,
  CreateDecodedPixAccountUseCase,
  KycGateway,
  UserService,
} from '@zro/pix-payments/application';
import {
  DecodedPixAccountEventEmitterControllerInterface,
  DecodedPixAccountEventEmitterController,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type BankIspb = Bank['ispb'];

type TCreateDecodedPixAccountRequest = Pick<
  DecodedPixAccount,
  'id' | 'personType' | 'document' | 'branch' | 'accountNumber' | 'accountType'
> & { userId: UserId; bankIspb: BankIspb };

export class CreateDecodedPixAccountRequest
  extends AutoValidator
  implements TCreateDecodedPixAccountRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsEnum(PersonType)
  personType: PersonType;

  @ValidateIf(
    (obj, val) =>
      (obj.personType === PersonType.NATURAL_PERSON && isCpf(val)) ||
      (obj.personType === PersonType.LEGAL_PERSON && isCnpj(val)),
  )
  @IsString()
  document: string;

  @IsString()
  @Length(8, 8)
  bankIspb: BankIspb;

  @IsString()
  @Length(4, 4)
  branch: string;

  @IsString()
  @MaxLength(255)
  accountNumber: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  constructor(props: TCreateDecodedPixAccountRequest) {
    super(props);
  }
}

type TCreateDecodedPixAccountResponse = Pick<
  DecodedPixAccount,
  'id' | 'name' | 'tradeName'
> & { paymentType: PaymentType };

export class CreateDecodedPixAccountResponse
  extends AutoValidator
  implements TCreateDecodedPixAccountResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tradeName?: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  constructor(props: TCreateDecodedPixAccountResponse) {
    super(props);
  }
}

export class CreateDecodedPixAccountController {
  private usecase: CreateDecodedPixAccountUseCase;

  constructor(
    private logger: Logger,
    pixDecodeAccountRepository: DecodedPixAccountRepository,
    eventEmitter: DecodedPixAccountEventEmitterControllerInterface,
    bankingService: BankingService,
    userService: UserService,
    maxPerDay: number,
    kycGateway: KycGateway,
    pixPaymentZroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: CreateDecodedPixAccountController.name,
    });

    const controllerEventEmitter = new DecodedPixAccountEventEmitterController(
      eventEmitter,
    );

    this.usecase = new CreateDecodedPixAccountUseCase(
      this.logger,
      pixDecodeAccountRepository,
      controllerEventEmitter,
      bankingService,
      userService,
      maxPerDay,
      kycGateway,
      pixPaymentZroBankIspb,
    );
  }

  async execute(
    request: CreateDecodedPixAccountRequest,
  ): Promise<CreateDecodedPixAccountResponse> {
    this.logger.debug('Pix decode by account request.', { request });

    const {
      id,
      userId,
      personType,
      bankIspb,
      branch,
      accountNumber,
      accountType,
      document,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const bank = new BankEntity({ ispb: bankIspb });

    const decodedPixAccount = await this.usecase.execute(
      id,
      user,
      personType,
      bank,
      branch,
      accountNumber,
      accountType,
      document,
    );

    if (!decodedPixAccount) return null;

    const response = new CreateDecodedPixAccountResponse({
      id: decodedPixAccount.id,
      name: decodedPixAccount.name,
      tradeName: decodedPixAccount.tradeName,
      paymentType: PaymentType.ACCOUNT,
    });

    this.logger.info('Pix decode by account response.', {
      decodedPixAccount: response,
    });

    return response;
  }
}
