import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { QrCodeStaticState } from '@zro/pix-payments/domain';
import {
  QrCodeStaticEvent,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';

export enum QrCodeStaticEventType {
  ERROR = 'ERROR',
  READY = 'READY',
  DELETED = 'DELETED',
  DELETING = 'DELETING',
  PENDING = 'PENDING',
}

type UserId = User['uuid'];

type TQrCodeStaticControllerEvent = { userId: UserId } & Pick<
  QrCodeStaticEvent,
  'id' | 'state' | 'txId' | 'expirationDate' | 'payableManyTimes'
>;

export class QrCodeStaticControllerEvent
  extends AutoValidator
  implements TQrCodeStaticControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsEnum(QrCodeStaticState)
  state: QrCodeStaticState;

  @IsString()
  @MaxLength(25)
  txId: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  expirationDate?: Date;

  @IsBoolean()
  payableManyTimes: boolean;

  constructor(props: TQrCodeStaticControllerEvent) {
    super(props);
  }
}

export interface QrCodeStaticEventEmitterControllerInterface {
  /**
   * Call qrCodeStatics microservice to emit qrCodeStatic.
   * @param eventName The event name.
   * @param event Data.
   */
  emitQrCodeStaticEvent: (
    eventName: QrCodeStaticEventType,
    event: QrCodeStaticControllerEvent,
  ) => void;
}

export class QrCodeStaticEventEmitterController
  implements QrCodeStaticEventEmitter
{
  constructor(
    private eventEmitter: QrCodeStaticEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorQrCodeStatic(event: QrCodeStaticEvent): void {
    const controllerEvent = new QrCodeStaticControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      txId: event.txId,
      expirationDate: event.expirationDate,
      payableManyTimes: event.payableManyTimes,
    });

    this.eventEmitter.emitQrCodeStaticEvent(
      QrCodeStaticEventType.ERROR,
      controllerEvent,
    );
  }

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyQrCodeStatic(event: QrCodeStaticEvent): void {
    const controllerEvent = new QrCodeStaticControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      txId: event.txId,
      expirationDate: event.expirationDate,
      payableManyTimes: event.payableManyTimes,
    });

    this.eventEmitter.emitQrCodeStaticEvent(
      QrCodeStaticEventType.READY,
      controllerEvent,
    );
  }

  /**
   * Emit deleted event.
   * @param event Data.
   */
  deletedQrCodeStatic(event: QrCodeStaticEvent): void {
    const controllerEvent = new QrCodeStaticControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      txId: event.txId,
      expirationDate: event.expirationDate,
      payableManyTimes: event.payableManyTimes,
    });

    this.eventEmitter.emitQrCodeStaticEvent(
      QrCodeStaticEventType.DELETED,
      controllerEvent,
    );
  }

  /**
   * Emit deleting event.
   * @param event Data.
   */
  deletingQrCodeStatic(event: QrCodeStaticEvent): void {
    const controllerEvent = new QrCodeStaticControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      txId: event.txId,
      expirationDate: event.expirationDate,
      payableManyTimes: event.payableManyTimes,
    });

    this.eventEmitter.emitQrCodeStaticEvent(
      QrCodeStaticEventType.DELETING,
      controllerEvent,
    );
  }

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingQrCodeStatic(event: QrCodeStaticEvent): void {
    const controllerEvent = new QrCodeStaticControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      txId: event.txId,
      expirationDate: event.expirationDate,
      payableManyTimes: event.payableManyTimes,
    });

    this.eventEmitter.emitQrCodeStaticEvent(
      QrCodeStaticEventType.PENDING,
      controllerEvent,
    );
  }
}
