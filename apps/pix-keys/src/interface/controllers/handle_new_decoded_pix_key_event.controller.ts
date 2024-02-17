import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  DecodedPixKeyEntity,
  DecodedPixKeyState,
  KeyType,
  UserPixKeyDecodeLimitRepository,
} from '@zro/pix-keys/domain';
import { UserEntity, PersonType } from '@zro/users/domain';
import {
  DecodedPixKeyEvent,
  HandleNewDecodedPixKeyEventUseCase as UseCase,
  UserService,
} from '@zro/pix-keys/application';

type THandleNewDecodedPixKeyEventRequest = Pick<
  DecodedPixKeyEvent,
  'id' | 'state' | 'key' | 'type' | 'personType' | 'userId'
>;

export class HandleNewDecodedPixKeyEventRequest
  extends AutoValidator
  implements THandleNewDecodedPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(DecodedPixKeyState)
  state: DecodedPixKeyState;

  @IsUUID(4)
  userId: string;

  @IsString()
  key: string;

  @IsEnum(KeyType)
  type: KeyType;

  @IsOptional()
  @IsEnum(PersonType)
  personType?: PersonType;

  constructor(props: THandleNewDecodedPixKeyEventRequest) {
    super(props);
  }
}

export class HandleNewDecodedPixKeyEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    userService: UserService,
    naturalPersonBucketLimit: number,
    legalPersonBucketLimit: number,
    temporalIncrementBucket: number,
    temporalIncrementBucketInterval: number,
    validTryDecrementOrIncrementBucket: number,
    invalidTryDecrementBucket: number,
  ) {
    this.logger = logger.child({
      context: HandleNewDecodedPixKeyEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      userPixKeyDecodeLimitRepository,
      userService,
      naturalPersonBucketLimit,
      legalPersonBucketLimit,
      temporalIncrementBucket,
      temporalIncrementBucketInterval,
      validTryDecrementOrIncrementBucket,
      invalidTryDecrementBucket,
    );
  }

  async execute(request: HandleNewDecodedPixKeyEventRequest): Promise<void> {
    this.logger.debug('Handle new decoded pix key event request.', { request });

    const { id, userId, key, personType, state } = request;

    const user = new UserEntity({ uuid: userId, type: personType });

    const decodedPixKey = new DecodedPixKeyEntity({
      id,
      state,
      key,
      personType,
      user,
    });

    await this.usecase.execute(decodedPixKey);

    this.logger.debug('Handle new decoded pix key event finished.');
  }
}
