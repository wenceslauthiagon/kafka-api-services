import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixQrCodeDynamicState } from '@zro/pix-payments/domain';
import {
  QrCodeDynamicEvent,
  QrCodeDynamicEventEmitter,
} from '@zro/pix-payments/application';

export enum QrCodeDynamicEventType {
  ERROR = 'ERROR',
  READY = 'READY',
  PENDING = 'PENDING',
}

type UserId = User['uuid'];

type TQrCodeDynamicControllerEvent = { userId: UserId } & Pick<
  QrCodeDynamicEvent,
  'id' | 'state' | 'txId' | 'expirationDate'
>;

export class QrCodeDynamicControllerEvent
  extends AutoValidator
  implements TQrCodeDynamicControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsEnum(PixQrCodeDynamicState)
  state: PixQrCodeDynamicState;

  @IsString()
  txId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  @IsOptional()
  expirationDate?: Date;

  constructor(props: TQrCodeDynamicControllerEvent) {
    super(props);
  }
}

export interface QrCodeDynamicEventEmitterControllerInterface {
  /**
   * Call qrCodeDynamics microservice to emit qrCodeDynamic.
   * @param eventName The event name.
   * @param event Data.
   */
  emitQrCodeDynamicEvent: (
    eventName: QrCodeDynamicEventType,
    event: QrCodeDynamicControllerEvent,
  ) => void;
}

export class QrCodeDynamicEventEmitterController
  implements QrCodeDynamicEventEmitter
{
  constructor(
    private eventEmitter: QrCodeDynamicEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingQrCodeDynamic(event: QrCodeDynamicEvent): void {
    const controllerEvent = new QrCodeDynamicControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      txId: event.txId,
      expirationDate: event.expirationDate,
    });

    this.eventEmitter.emitQrCodeDynamicEvent(
      QrCodeDynamicEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit error event.
   * @param event Data.
   */
  errorQrCodeDynamic(event: QrCodeDynamicEvent): void {
    const controllerEvent = new QrCodeDynamicControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      txId: event.txId,
      expirationDate: event.expirationDate,
    });

    this.eventEmitter.emitQrCodeDynamicEvent(
      QrCodeDynamicEventType.ERROR,
      controllerEvent,
    );
  }

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyQrCodeDynamic(event: QrCodeDynamicEvent): void {
    const controllerEvent = new QrCodeDynamicControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      txId: event.txId,
      expirationDate: event.expirationDate,
    });

    this.eventEmitter.emitQrCodeDynamicEvent(
      QrCodeDynamicEventType.READY,
      controllerEvent,
    );
  }
}
