import { Logger } from 'winston';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsCpfOrCnpj } from '@zro/common';
import { PersonType, User, UserRepository } from '@zro/users/domain';
import { GetUserByIdUseCase } from '@zro/users/application';

type TGetUserByIdRequest = Pick<User, 'id'>;

export class GetUserByIdRequest
  extends AutoValidator
  implements TGetUserByIdRequest
{
  @IsPositive()
  id: number;

  constructor(props: TGetUserByIdRequest) {
    super(props);
  }
}

type TGetUserByIdResponse = Pick<
  User,
  | 'id'
  | 'uuid'
  | 'document'
  | 'type'
  | 'fullName'
  | 'phoneNumber'
  | 'pin'
  | 'pinHasCreated'
  | 'active'
  | 'name'
> & { fcmToken?: User['fcmToken'] };

export class GetUserByIdResponse
  extends AutoValidator
  implements TGetUserByIdResponse
{
  @IsPositive()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsOptional()
  @IsCpfOrCnpj()
  document?: string;

  @IsEnum(PersonType)
  type: PersonType;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  @IsNotEmpty()
  pin: string;

  @IsDefined()
  pinHasCreated: boolean;

  @IsOptional()
  @IsString()
  fcmToken?: string;

  @IsBoolean()
  active: boolean;

  @IsString()
  @Length(1, 255)
  name: string;

  constructor(props: TGetUserByIdResponse) {
    super(props);
  }
}

export class GetUserByIdController {
  private usecase: GetUserByIdUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
  ) {
    this.logger = logger.child({ context: GetUserByIdController.name });
    this.usecase = new GetUserByIdUseCase(this.logger, userRepository);
  }

  async execute(request: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    this.logger.debug('Getting user request.', { request });

    const { id } = request;

    const user = await this.usecase.execute(id);

    if (!user) return null;

    const response = new GetUserByIdResponse({
      id: user.id,
      uuid: user.uuid,
      document: user.document,
      type: user.type,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      pin: user.pin,
      pinHasCreated: user.pinHasCreated,
      fcmToken: user.fcmToken,
      active: user.active,
      name: user.name,
    });

    return response;
  }
}
