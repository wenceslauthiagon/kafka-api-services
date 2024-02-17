import { Logger } from 'winston';
import { IsEnum, IsUUID, IsString, IsOptional } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { PersonType, UserEntity } from '@zro/users/domain';
import {
  DecodedPixKeyState,
  DecodedPixKeyRepository,
  KeyType,
} from '@zro/pix-keys/domain';
import {
  HandleErrorDecodedPixKeyEventUseCase as UseCase,
  DecodedPixKeyEvent,
} from '@zro/pix-keys/application';

type THandleErrorDecodedPixKeyEventRequest = Pick<
  DecodedPixKeyEvent,
  'id' | 'state' | 'key' | 'type' | 'personType' | 'userId'
>;

export class HandleErrorDecodedPixKeyEventRequest
  extends AutoValidator
  implements THandleErrorDecodedPixKeyEventRequest
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

  constructor(props: THandleErrorDecodedPixKeyEventRequest) {
    super(props);
  }
}

export class HandleErrorDecodedPixKeyEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    decodedPixKeyRepository: DecodedPixKeyRepository,
    ispb: string,
  ) {
    this.logger = logger.child({
      context: HandleErrorDecodedPixKeyEventController.name,
    });

    this.usecase = new UseCase(logger, decodedPixKeyRepository, ispb);
  }

  async execute(request: HandleErrorDecodedPixKeyEventRequest): Promise<void> {
    this.logger.debug('Handle error decode pix key request.', { request });

    const { id, userId, key, personType, type, state } = request;

    const user = new UserEntity({ uuid: userId, type: personType });

    await this.usecase.execute(id, user, key, type, state);

    this.logger.debug('Handle error decode pix key finished.');
  }
}
