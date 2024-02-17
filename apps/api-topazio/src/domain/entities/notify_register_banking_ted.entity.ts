import { Domain } from '@zro/common';
import { NotifyStateType } from './types.entity';

export enum NotifyRegisterBankingTedStatus {
  ERROR = 'ERRO',
  ERROR_NOTIFICATION = 'ERRO_NOTIFICACAO',
  ERROR_CONFIRMED = 'ERRO_CONFIRMACAO',
  TED_NOT_DONE = 'TED_NAO_EFETUADA',
  TED_RECEIVED = 'TED_RECEBIDA',
  TED_FORWARDED = 'TRANSFERENCIA_ENCAMINHADA',
  IN_PROCESSING = 'EM_PROCESSAMENTO',
  CONFIRMED = 'CONFIRMADA',
}

export interface NotifyRegisterBankingTed extends Domain<string> {
  transactionId: string;
  status: NotifyRegisterBankingTedStatus;
  state: NotifyStateType;
  code?: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyRegisterBankingTedEntity
  implements NotifyRegisterBankingTed
{
  id?: string;
  transactionId: string;
  status: NotifyRegisterBankingTedStatus;
  state: NotifyStateType;
  code?: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyRegisterBankingTed>) {
    Object.assign(this, props);
  }
}
