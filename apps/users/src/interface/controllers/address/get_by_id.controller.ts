import { Logger } from 'winston';
import {
  IsDate,
  IsInt,
  IsString,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  Address,
  AddressRepository,
  User,
  UserEntity,
} from '@zro/users/domain';
import { GetAddressByIdUseCase } from '@zro/users/application';

type UserId = User['uuid'];

type TGetAddressByIdRequest = Pick<Address, 'id'> & { userId: UserId };

export class GetAddressByIdRequest
  extends AutoValidator
  implements TGetAddressByIdRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsInt()
  @IsPositive()
  id: number;

  constructor(props: TGetAddressByIdRequest) {
    super(props);
  }
}

type TGetAddressByIdResponse = Pick<
  Address,
  'id' | 'city' | 'street' | 'zipCode' | 'federativeUnit' | 'createdAt'
>;

export class GetAddressByIdResponse
  extends AutoValidator
  implements TGetAddressByIdResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  zipCode: string;

  @IsOptional()
  @IsString()
  federativeUnit: string;

  @IsDate()
  createdAt: Date;

  constructor(props: TGetAddressByIdResponse) {
    super(props);
  }
}

export class GetAddressByIdController {
  private usecase: GetAddressByIdUseCase;

  constructor(
    private logger: Logger,
    addressRepository: AddressRepository,
  ) {
    this.logger = logger.child({ context: GetAddressByIdController.name });
    this.usecase = new GetAddressByIdUseCase(this.logger, addressRepository);
  }

  async execute(
    request: GetAddressByIdRequest,
  ): Promise<GetAddressByIdResponse> {
    this.logger.debug('Getting address request.', { request });

    const { id, userId } = request;

    const user = new UserEntity({ uuid: userId });

    const address = await this.usecase.execute(id, user);

    if (!address) return null;

    const response = new GetAddressByIdResponse({
      id: address.id,
      city: address.city,
      street: address.street,
      zipCode: address.zipCode,
      federativeUnit: address.federativeUnit,
      createdAt: address.createdAt,
    });

    this.logger.debug('Getting address response.', { response });

    return response;
  }
}
