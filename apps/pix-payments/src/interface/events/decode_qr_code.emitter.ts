import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import { DecodedQrCodeState } from '@zro/pix-payments/domain';
import {
  DecodedQrCodeEvent,
  DecodedQrCodeEventEmitter,
} from '@zro/pix-payments/application';

export enum DecodedQrCodeEventType {
  ERROR = 'ERROR',
  READY = 'READY',
  DELETED = 'DELETED',
  DELETING = 'DELETING',
  PENDING = 'PENDING',
}

type TDecodedQrCodeControllerEvent = {
  userId: User['uuid'];
} & Pick<DecodedQrCodeEvent, 'id' | 'state' | 'emv'>;

export class DecodedQrCodeControllerEvent
  extends AutoValidator
  implements TDecodedQrCodeControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: string;

  @IsString()
  @IsNotEmpty()
  emv: string;

  @IsEnum(DecodedQrCodeState)
  state: DecodedQrCodeState;

  constructor(props: TDecodedQrCodeControllerEvent) {
    super(props);
  }
}

export interface DecodeQrCodeEventEmitterControllerInterface {
  /**
   * Call decode QR code microservice to emit decoded QR code.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDecodedQrCodeEvent: (
    eventName: DecodedQrCodeEventType,
    event: DecodedQrCodeControllerEvent,
  ) => void;
}

export class DecodeQrCodeEventEmitterController
  implements DecodedQrCodeEventEmitter
{
  constructor(
    private eventEmitter: DecodeQrCodeEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorDecodedQrCode(event: DecodedQrCodeEvent): void {
    const controllerEvent = new DecodedQrCodeControllerEvent({
      id: event.id,
      emv: event.emv,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDecodedQrCodeEvent(
      DecodedQrCodeEventType.ERROR,
      controllerEvent,
    );
  }

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyDecodedQrCode(event: DecodedQrCodeEvent): void {
    const controllerEvent = new DecodedQrCodeControllerEvent({
      id: event.id,
      emv: event.emv,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDecodedQrCodeEvent(
      DecodedQrCodeEventType.READY,
      controllerEvent,
    );
  }

  /**
   * Emit deleted event.
   * @param event Data.
   */
  deletedDecodedQrCode(event: DecodedQrCodeEvent): void {
    const controllerEvent = new DecodedQrCodeControllerEvent({
      id: event.id,
      emv: event.emv,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDecodedQrCodeEvent(
      DecodedQrCodeEventType.DELETED,
      controllerEvent,
    );
  }

  /**
   * Emit deleting event.
   * @param event Data.
   */
  deletingDecodedQrCode(event: DecodedQrCodeEvent): void {
    const controllerEvent = new DecodedQrCodeControllerEvent({
      id: event.id,
      emv: event.emv,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDecodedQrCodeEvent(
      DecodedQrCodeEventType.DELETING,
      controllerEvent,
    );
  }

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingDecodedQrCode(event: DecodedQrCodeEvent): void {
    const controllerEvent = new DecodedQrCodeControllerEvent({
      id: event.id,
      emv: event.emv,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDecodedQrCodeEvent(
      DecodedQrCodeEventType.PENDING,
      controllerEvent,
    );
  }
}
