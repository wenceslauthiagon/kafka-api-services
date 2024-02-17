import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import { DecodedPixAccountState } from '@zro/pix-payments/domain';
import {
  DecodedPixAccountEvent,
  DecodedPixAccountEventEmitter,
} from '@zro/pix-payments/application';

export enum DecodedPixAccountEventType {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
}

type UserId = User['uuid'];

type TDecodePixAccountControllerEvent = {
  userId: UserId;
} & Pick<DecodedPixAccountEvent, 'id' | 'name' | 'tradeName' | 'state'>;

export class DecodedPixAccountControllerEvent
  extends AutoValidator
  implements TDecodePixAccountControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(255)
  tradeName?: string;

  @IsEnum(DecodedPixAccountState)
  state: DecodedPixAccountState;

  constructor(props: TDecodePixAccountControllerEvent) {
    super(props);
  }
}

export interface DecodedPixAccountEventEmitterControllerInterface {
  /**
   * Emit decodedPixAccount event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDecodedPixAccountEvent(
    eventName: DecodedPixAccountEventType,
    event: DecodedPixAccountControllerEvent,
  ): void;
}

export class DecodedPixAccountEventEmitterController
  implements DecodedPixAccountEventEmitter
{
  constructor(
    private eventEmitter: DecodedPixAccountEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending decodedPixAccount event.
   * @param event Data.
   */
  pendingDecodedPixAccount(event: DecodedPixAccountEvent): void {
    const controllerEvent = new DecodedPixAccountControllerEvent({
      id: event.id,
      name: event.name,
      tradeName: event.tradeName,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDecodedPixAccountEvent(
      DecodedPixAccountEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed decodedPixAccount event.
   * @param event Data.
   */
  confirmedDecodedPixAccount(event: DecodedPixAccountEvent): void {
    const controllerEvent = new DecodedPixAccountControllerEvent({
      id: event.id,
      name: event.name,
      tradeName: event.tradeName,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDecodedPixAccountEvent(
      DecodedPixAccountEventType.CONFIRMED,
      controllerEvent,
    );
  }
}
