import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  Pagination,
  TPaginationResponse,
  PaginationEntity,
  PaginationRequest,
  Sort,
  PaginationSort,
  AutoValidator,
  IsIsoStringDateFormat,
  PaginationResponse,
} from '@zro/common';
import { PersonType, User, UserEntity } from '@zro/users/domain';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { GetAllPixKeyByUserUseCase as UseCase } from '@zro/pix-keys/application';

type UserId = User['uuid'];

export enum GetAllPixKeyByUserRequestSort {
  ID = 'id',
  CREATED_AT = 'created_at',
}

export type TGetAllPixKeyByUserRequest = Pagination & {
  userId: UserId;
  personType: PersonType;
};

export class GetAllPixKeyByUserRequest
  extends PaginationRequest
  implements TGetAllPixKeyByUserRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsEnum(PersonType)
  personType: PersonType;

  @IsOptional()
  @Sort(GetAllPixKeyByUserRequestSort)
  sort?: PaginationSort;
}

type TGetAllPixKeyByUserResponseItem = Pick<
  PixKey,
  'id' | 'key' | 'type' | 'state' | 'createdAt'
>;

export class GetAllPixKeyByUserResponseItem
  extends AutoValidator
  implements TGetAllPixKeyByUserResponseItem
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  key: string;

  @IsEnum(KeyType)
  type: KeyType;

  @IsEnum(KeyState)
  state: KeyState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllPixKeyByUserResponseItem) {
    super(props);
  }
}

export type TGetAllPixKeyByUserResponse =
  TPaginationResponse<GetAllPixKeyByUserResponseItem> & { maxTotal: number };

export class GetAllPixKeyByUserResponse
  extends PaginationResponse<GetAllPixKeyByUserResponseItem>
  implements TGetAllPixKeyByUserResponse
{
  @IsInt()
  @IsPositive()
  maxTotal: number;
}

export class GetAllPixKeyByUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    private readonly naturalPersonMaxNumberOfKeys: number,
    private readonly legalPersonMaxNumberOfKeys: number,
  ) {
    this.logger = logger.child({ context: GetAllPixKeyByUserController.name });
    this.usecase = new UseCase(this.logger, pixKeyRepository);
  }

  async execute(
    request: GetAllPixKeyByUserRequest,
  ): Promise<GetAllPixKeyByUserResponse> {
    const { order, page, pageSize, sort, userId, personType } = request;
    this.logger.debug('Get all Pix keys by user.', { request });

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const user = new UserEntity({ uuid: userId });

    const results = await this.usecase.execute(pagination, user);

    const maxTotal =
      personType === PersonType.NATURAL_PERSON
        ? this.naturalPersonMaxNumberOfKeys
        : this.legalPersonMaxNumberOfKeys;

    const data = results.data.map(
      (pixKey) =>
        new GetAllPixKeyByUserResponseItem({
          id: pixKey.id,
          key: pixKey.key,
          type: pixKey.type,
          state: pixKey.state,
          createdAt: pixKey.createdAt,
        }),
    );

    return { ...results, maxTotal, data };
  }
}
