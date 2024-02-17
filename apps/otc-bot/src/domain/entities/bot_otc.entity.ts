import { Domain, formatValueFromIntBpsToFloat } from '@zro/common';
import { Provider } from '@zro/otc/domain';
import { StreamPair } from '@zro/quotations/domain';

export enum BotOtcControl {
  STAND_BY = 'STAND_BY',
  START = 'START',
  STOP = 'STOP',
}

export enum BotOtcStatus {
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
}

export enum BotOtcType {
  SPREAD = 'SPREAD',
}

export interface BotOtc extends Domain<string> {
  name: string;
  fromPair: StreamPair;
  fromProvider: Provider;
  toPair: StreamPair;
  toProvider: Provider;
  spread: number;
  spreadFloat: number;
  balance: number;
  step: number;
  control: BotOtcControl;
  status: BotOtcStatus;
  type: BotOtcType;
  failedCode?: string;
  failedMessage?: string;
  isRunning(): boolean;
  isStoping(): boolean;
  isStopped(): boolean;
  shouldStart(): boolean;
  shouldStop(): boolean;
  shouldKill(): boolean;
}

export class BotOtcEntity implements BotOtc {
  id?: string;
  name: string;
  fromPair: StreamPair;
  fromProvider: Provider;
  toPair: StreamPair;
  toProvider: Provider;
  spread: number;
  balance: number;
  step: number;
  control: BotOtcControl;
  status: BotOtcStatus;
  type: BotOtcType;
  failedCode?: string;
  failedMessage?: string;

  constructor(props: Partial<BotOtc>) {
    Object.assign(this, props);
  }

  get spreadFloat() {
    return formatValueFromIntBpsToFloat(this.spread);
  }

  isRunning(): boolean {
    return this.status === BotOtcStatus.RUNNING;
  }

  isStoping(): boolean {
    return this.status === BotOtcStatus.STOPPING;
  }

  isStopped(): boolean {
    return [BotOtcStatus.STOPPED, BotOtcStatus.ERROR].includes(this.status);
  }

  shouldStart(): boolean {
    return (
      this.control === BotOtcControl.START &&
      [BotOtcStatus.STOPPED, BotOtcStatus.ERROR].includes(this.status)
    );
  }

  shouldStop(): boolean {
    return (
      this.control === BotOtcControl.STOP &&
      [BotOtcStatus.RUNNING, BotOtcStatus.ERROR].includes(this.status)
    );
  }

  shouldKill(): boolean {
    return [BotOtcStatus.RUNNING, BotOtcStatus.STOPPING].includes(this.status);
  }
}
