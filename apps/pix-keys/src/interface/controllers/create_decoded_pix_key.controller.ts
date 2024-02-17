import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  DecodedPixKey,
  DecodedPixKeyRepository,
  KeyType,
  PixKeyRepository,
  UserPixKeyDecodeLimitRepository,
  DecodedPixKeyCacheRepository,
} from '@zro/pix-keys/domain';
import { AccountType, PaymentType } from '@zro/pix-payments/domain';
import { UserEntity, PersonType, User } from '@zro/users/domain';
import {
  DecodedPixKeyPspGateway,
  CreateDecodedPixKeyUseCase as UseCase,
  UserService,
} from '@zro/pix-keys/application';
import {
  DecodedPixKeyEventEmitterController,
  DecodedPixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

type TCreateDecodedPixKeyRequest = Pick<
  DecodedPixKey,
  'id' | 'key' | 'type' | 'endToEndId'
> & { userId: User['uuid'] };

export class CreateDecodedPixKeyRequest
  extends AutoValidator
  implements TCreateDecodedPixKeyRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: string;

  @IsString()
  @MaxLength(77)
  key: string;

  @IsEnum(KeyType)
  type: KeyType;

  @IsOptional()
  @IsString()
  endToEndId?: string;

  constructor(props: TCreateDecodedPixKeyRequest) {
    super(props);
  }
}

type TCreateDecodedPixKeyResponse = Pick<
  DecodedPixKey,
  | 'id'
  | 'dictAccountId'
  | 'cidId'
  | 'type'
  | 'accountType'
  | 'personType'
  | 'key'
  | 'branch'
  | 'accountNumber'
  | 'ispb'
  | 'document'
  | 'name'
  | 'tradeName'
  | 'activeAccount'
  | 'accountOpeningDate'
  | 'keyCreationDate'
  | 'keyOwnershipDate'
  | 'claimRequestDate'
  | 'endToEndId'
  | 'createdAt'
> & { paymentType: PaymentType };

export class CreateDecodedPixKeyResponse
  extends AutoValidator
  implements TCreateDecodedPixKeyResponse
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsNumber()
  dictAccountId: number;

  @IsOptional()
  @IsString()
  cidId?: string;

  @IsEnum(KeyType)
  type: KeyType;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsEnum(PersonType)
  personType: PersonType;

  @IsString()
  @MaxLength(77)
  key: string;

  @IsString()
  branch: string;

  @IsString()
  accountNumber: string;

  @IsString()
  ispb: string;

  @IsString()
  document: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsBoolean()
  activeAccount: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format accountOpeningDate',
  })
  accountOpeningDate: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format keyCreationDate',
  })
  keyCreationDate: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format keyOwnershipDate',
  })
  keyOwnershipDate?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format claimRequestDate',
  })
  claimRequestDate?: Date;

  @IsOptional()
  @IsString()
  endToEndId?: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateDecodedPixKeyResponse) {
    super(props);
  }
}

export class CreateDecodedPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    decodedPixKeyRepository: DecodedPixKeyRepository,
    pixKeyRepository: PixKeyRepository,
    decodedPixKeyCacheRepository: DecodedPixKeyCacheRepository,
    serviceEventEmitter: DecodedPixKeyEventEmitterControllerInterface,
    userService: UserService,
    decodedPixKeyGateway: DecodedPixKeyPspGateway,
    userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    ispb: string,
    naturalPersonBucketLimit: number,
    legalPersonBucketLimit: number,
    temporalIncrementBucketInterval: number,
    temporalIncrementBucket: number,
  ) {
    this.logger = logger.child({ context: CreateDecodedPixKeyController.name });

    const eventEmitter = new DecodedPixKeyEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      decodedPixKeyRepository,
      pixKeyRepository,
      decodedPixKeyCacheRepository,
      eventEmitter,
      userService,
      decodedPixKeyGateway,
      userPixKeyDecodeLimitRepository,
      ispb,
      naturalPersonBucketLimit,
      legalPersonBucketLimit,
      temporalIncrementBucketInterval,
      temporalIncrementBucket,
    );
  }

  async execute(
    request: CreateDecodedPixKeyRequest,
  ): Promise<CreateDecodedPixKeyResponse> {
    this.logger.debug('Decode pix key request.', { request });

    const { id, userId, key, type } = request;

    const user = new UserEntity({ uuid: userId });

    const decodedPixKey = await this.usecase.execute(id, user, key, type);

    if (!decodedPixKey) return null;

    const response = new CreateDecodedPixKeyResponse({
      id: decodedPixKey.id,
      dictAccountId: decodedPixKey.dictAccountId,
      cidId: decodedPixKey.cidId,
      type: decodedPixKey.type,
      accountType: decodedPixKey.accountType,
      personType: decodedPixKey.personType,
      key: decodedPixKey.key,
      branch: decodedPixKey.branch,
      accountNumber: decodedPixKey.accountNumber,
      ispb: decodedPixKey.ispb,
      document: decodedPixKey.document,
      name: decodedPixKey.name,
      tradeName: decodedPixKey.tradeName,
      activeAccount: decodedPixKey.activeAccount,
      accountOpeningDate: decodedPixKey.accountOpeningDate,
      keyCreationDate: decodedPixKey.keyCreationDate,
      keyOwnershipDate: decodedPixKey.keyOwnershipDate,
      claimRequestDate: decodedPixKey.claimRequestDate,
      endToEndId: decodedPixKey.endToEndId,
      paymentType: PaymentType.KEY,
      createdAt: decodedPixKey.createdAt,
    });

    this.logger.debug('Decode pix key response.', { response });

    return response;
  }
}
