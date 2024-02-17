import * as randomstring from 'randomstring';
import { Domain, dhexToInt, getMoment, intToDhex } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey } from '@zro/pix-keys/domain';

export enum QrCodeStaticState {
  PENDING = 'PENDING',
  READY = 'READY',
  DELETING = 'DELETING',
  DELETED = 'DELETED',
  ERROR = 'ERROR',
}

/**
 * Table with possible payable types
 * | MANY_PAID_TIMES | WITH_VALUE | DUE_DATE |
 * |        X        |      X     |     X    | // with cache
 * |        X        |      X     |          | // no cache
 * |        X        |            |          | // no cache
 * |                 |            |          | // Error
 * |                 |      X     |          | // Error
 * |                 |            |     X    | // with cache
 * |                 |      X     |     X    | // with cache
 * |        X        |            |     X    | // with cache
 */
export enum QrCodeStaticPrefixMask {
  WITH_VALUE = 1 << 0, // bit 0
  DUE_DATE = 1 << 1, // bit 1
  MANY_PAID_TIMES = 1 << 2, // bit 2
}

const PREFIX_SIZE = 1;
const DUE_DATE_DHEX_SIZE = 9;
const VALUE_DHEX_SIZE = 8;
const RANDOM_SIZE = 6;
const CHECKSUM_SIZE = 1;
const FORMAT_DATE = 'YYYYMMDDHHmmss';

/**
 * QrCodeStatic.
 */
export interface QrCodeStatic extends Domain<string> {
  txId: string;
  summary?: string;
  description?: string;
  documentValue?: number;
  recipientCity: string;
  recipientName: string;
  emv?: string;
  ispb?: string;
  paymentLinkUrl?: string;
  user: User;
  pixKey: PixKey;
  state: QrCodeStaticState;
  ispbWithdrawal?: string;
  expirationDate?: Date;
  payableManyTimes: boolean;
  createdAt: Date;
}

export class QrCodeStaticEntity implements QrCodeStatic {
  id: string;
  txId: string;
  summary?: string;
  description?: string;
  documentValue?: number;
  recipientCity: string;
  recipientName: string;
  emv?: string;
  ispb?: string;
  paymentLinkUrl?: string;
  pixKey: PixKey;
  user: User;
  state: QrCodeStaticState;
  ispbWithdrawal?: string;
  expirationDate?: Date;
  payableManyTimes: boolean;
  createdAt: Date;

  constructor(props: Partial<QrCodeStatic>) {
    Object.assign(this, props);
    this.txId = this.txId ?? this.createTxId();
  }

  /**
   * Create a txid with qrCode params and return a string decoded.
   * @returns txid
   */
  private createTxId(): string {
    // If it can be paid just one time, then it must have an expiration date.
    if (!this.payableManyTimes && !this.expirationDate) {
      throw new Error(
        'Expiration date is required when payableManyTimes is false.',
      );
    }

    let prefixFlag = 0;
    let amount: string = null;
    let datetime: string = null;

    if (this.payableManyTimes) {
      prefixFlag |= this.payableManyTimes
        ? QrCodeStaticPrefixMask.MANY_PAID_TIMES
        : 0;
    }

    if (this.expirationDate) {
      prefixFlag |= this.expirationDate ? QrCodeStaticPrefixMask.DUE_DATE : 0;
      datetime = intToDhex(getMoment(this.expirationDate).format(FORMAT_DATE));
    } else {
      datetime = randomstring.generate({
        length: DUE_DATE_DHEX_SIZE,
        charset: 'alphanumeric',
      });
    }

    if (this.documentValue) {
      prefixFlag |= this.documentValue ? QrCodeStaticPrefixMask.WITH_VALUE : 0;
      amount = intToDhex(this.documentValue ?? 0).padStart(
        VALUE_DHEX_SIZE,
        '0',
      );
    } else {
      amount = randomstring.generate({
        length: VALUE_DHEX_SIZE,
        charset: 'alphanumeric',
      });
    }

    const prefix = String.fromCharCode('Z'.charCodeAt(0) - prefixFlag);
    const random = randomstring.generate({
      length: RANDOM_SIZE,
      charset: 'alphanumeric',
    });

    const result = `${prefix}${datetime}${amount}${random}`;

    const checksum = intToDhex(
      result
        .split('')
        .reduce((acc, letter) => letter.charCodeAt(0) ^ acc, 0xff),
    ).charAt(0);

    return `${result}${checksum}`;
  }

  // It checks if first letter in txId is between Z and Z - PrefixMask.length.
  // It means that the letter is within the possible values.
  isFastFormat(): boolean {
    return (
      this.txId.charCodeAt(0) >
        'Z'.charCodeAt(0) -
          // see https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
          (1 << (Object.keys(QrCodeStaticPrefixMask).length / 2)) &&
      this.txId.charCodeAt(0) <= 'Z'.charCodeAt(0)
    );
  }

  // The flag value is the position in ASCII table < letter Z.
  private getPrefixFlags(): number {
    // Sanity test
    if (!this.isFastFormat()) {
      throw new Error('This QRCode has no FastFormat.');
    }

    return 'Z'.charCodeAt(0) - this.txId.charCodeAt(0);
  }

  isPayableManyTimes(): boolean {
    return (this.getPrefixFlags() & QrCodeStaticPrefixMask.MANY_PAID_TIMES) > 0;
  }

  hasValue(): boolean {
    return (this.getPrefixFlags() & QrCodeStaticPrefixMask.WITH_VALUE) > 0;
  }

  hasDueDate(): boolean {
    return (this.getPrefixFlags() & QrCodeStaticPrefixMask.DUE_DATE) > 0;
  }

  getValue(): number {
    return Number(
      dhexToInt(
        this.txId.substring(
          PREFIX_SIZE + DUE_DATE_DHEX_SIZE,
          PREFIX_SIZE + DUE_DATE_DHEX_SIZE + VALUE_DHEX_SIZE,
        ),
      ),
    );
  }

  getDueDate(): Date {
    const dateTime = dhexToInt(
      this.txId.substring(PREFIX_SIZE, PREFIX_SIZE + DUE_DATE_DHEX_SIZE),
    ).toString();

    return getMoment(dateTime, FORMAT_DATE).toDate();
  }

  checkTxId(): boolean {
    // Sanity test
    if (!this.isFastFormat()) {
      throw new Error('TxId is not fast format.');
    }

    const prefix = this.txId.substring(0, PREFIX_SIZE);
    const datetime = this.txId.substring(
      PREFIX_SIZE,
      PREFIX_SIZE + DUE_DATE_DHEX_SIZE,
    );
    const amount = this.txId.substring(
      PREFIX_SIZE + DUE_DATE_DHEX_SIZE,
      PREFIX_SIZE + DUE_DATE_DHEX_SIZE + VALUE_DHEX_SIZE,
    );
    const random = this.txId.substring(
      PREFIX_SIZE + DUE_DATE_DHEX_SIZE + VALUE_DHEX_SIZE,
      PREFIX_SIZE + DUE_DATE_DHEX_SIZE + VALUE_DHEX_SIZE + RANDOM_SIZE,
    );
    const checksum = this.txId.substring(
      PREFIX_SIZE + DUE_DATE_DHEX_SIZE + VALUE_DHEX_SIZE + RANDOM_SIZE,
      PREFIX_SIZE +
        DUE_DATE_DHEX_SIZE +
        VALUE_DHEX_SIZE +
        RANDOM_SIZE +
        CHECKSUM_SIZE,
    );

    const result = `${prefix}${datetime}${amount}${random}`;

    const check = intToDhex(
      result
        .split('')
        .reduce((acc, letter) => letter.charCodeAt(0) ^ acc, 0xff),
    ).charAt(0);

    return check === checksum;
  }
}
