import {
  IsUUID,
  IsNotEmpty,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { SignupState } from '@zro/signup/domain';
import { SignupEvent, SignupEventEmitter } from '@zro/signup/application';

export enum SignupEventType {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  NOT_CONFIRMED = 'NOT_CONFIRMED',
  READY = 'READY',
  DUPLICATED = 'DUPLICATED',
  BLOCK_LIST = 'BLOCK_LIST',
  EXPIRED = 'EXPIRED',
}

type TSignupControllerEvent = Pick<SignupEvent, 'id' | 'state' | 'phoneNumber'>;

export class SignupControllerEvent
  extends AutoValidator
  implements TSignupControllerEvent
{
  @IsUUID()
  id: string;

  @IsEnum(SignupState)
  state: SignupState;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  constructor(props: TSignupControllerEvent) {
    super(props);
  }
}

export interface SignupEventEmitterControllerInterface {
  /**
   * Emit signup event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitSignupEvent(
    eventName: SignupEventType,
    event: SignupControllerEvent,
  ): void;
}

export class SignupEventEmitterController implements SignupEventEmitter {
  constructor(private eventEmitter: SignupEventEmitterControllerInterface) {}

  /**
   * Emit signup pending event.
   * @param event Data.
   */
  pendingSignup(event: SignupEvent): void {
    const controllerEvent = new SignupControllerEvent({
      id: event.id,
      phoneNumber: event.phoneNumber,
      state: event.state,
    });

    this.eventEmitter.emitSignupEvent(SignupEventType.PENDING, controllerEvent);
  }

  /**
   * Emit signup confirmed event.
   * @param signup Data.
   */
  confirmSignup(event: SignupEvent): void {
    const controllerEvent = new SignupControllerEvent({
      id: event.id,
      phoneNumber: event.phoneNumber,
      state: event.state,
    });

    this.eventEmitter.emitSignupEvent(
      SignupEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Eemit signup not confirmed event.
   * @param signup Data.
   */
  notConfirmSignup(event: SignupEvent): void {
    const controllerEvent = new SignupControllerEvent({
      id: event.id,
      phoneNumber: event.phoneNumber,
      state: event.state,
    });

    this.eventEmitter.emitSignupEvent(
      SignupEventType.NOT_CONFIRMED,
      controllerEvent,
    );
  }

  duplicateSignup(event: SignupEvent): void {
    const controllerEvent = new SignupControllerEvent({
      id: event.id,
      phoneNumber: event.phoneNumber,
      state: event.state,
    });

    this.eventEmitter.emitSignupEvent(
      SignupEventType.DUPLICATED,
      controllerEvent,
    );
  }

  readySignup(event: SignupEvent): void {
    const controllerEvent = new SignupControllerEvent({
      id: event.id,
      phoneNumber: event.phoneNumber,
      state: event.state,
    });

    this.eventEmitter.emitSignupEvent(SignupEventType.READY, controllerEvent);
  }
}
