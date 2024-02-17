import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { QrCodeEvent, QrCodeEventEmitter } from '@zro/pix-zro-pay/application';
import { BankAccount, Client, Company } from '@zro/pix-zro-pay/domain';
import {
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export enum QrCodeEventType {
  READY = 'READY',
}

type TQrCodeControllerEvent = QrCodeEvent;

export class QrCodeControllerEvent
  extends AutoValidator
  implements TQrCodeControllerEvent
{
  @IsUUID(4)
  transactionUuid: string;

  @IsString()
  txId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  payerDocument?: number;

  @IsString()
  emv: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  value?: number;

  @IsDefined()
  company: Company;

  @IsDefined()
  bankAccount: BankAccount;

  @IsDefined()
  client: Client;

  @IsString()
  merchantId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TQrCodeControllerEvent) {
    super(props);
  }
}

export interface QrCodeEventEmitterControllerInterface {
  /**
   * Call qrCodes microservice to emit qrCode.
   * @param eventName The event name.
   * @param event Data.
   */
  emitQrCodeEvent: (
    eventName: QrCodeEventType,
    event: QrCodeControllerEvent,
  ) => void;
}

export class QrCodeEventEmitterController implements QrCodeEventEmitter {
  constructor(private eventEmitter: QrCodeEventEmitterControllerInterface) {}

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyQrCode(event: QrCodeEvent): void {
    const controllerEvent = new QrCodeControllerEvent({
      transactionUuid: event.transactionUuid,
      txId: event.txId,
      description: event.description,
      payerDocument: event.payerDocument,
      emv: event.emv,
      expirationDate: event.expirationDate,
      value: event.value,
      company: event.company,
      bankAccount: event.bankAccount,
      client: event.client,
      merchantId: event.merchantId,
      createdAt: event.createdAt,
    });

    this.eventEmitter.emitQrCodeEvent(QrCodeEventType.READY, controllerEvent);
  }
}
