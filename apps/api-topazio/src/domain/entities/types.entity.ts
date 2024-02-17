export enum NotifyStateType {
  READY = 'READY',
  ERROR = 'ERROR',
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  CHARGEBACK = 'CHARGEBACK',
}

export enum OperationType {
  CREDIT = 'C',
  DEBIT = 'D',
}

export enum StatusType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatusType {
  SETTLED = 'SETTLED',
  PROCESSING = 'PROCESSING',
  CHARGEBACK = 'CHARGEBACK',
}

export enum InfractionType {
  FRAUD = 'FRAUD',
  AML_CTF = 'AML_CTF',
}

export enum ReportedByType {
  DEBITED_PARTICIPANT = 'DEBITED_PARTICIPANT',
  CREDITED_PARTICIPANT = 'CREDITED_PARTICIPANT',
}

export enum InfractionStatusType {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum AnalysisResultType {
  AGREED = 'AGREED',
  DISAGREED = 'DISAGREED',
}

export enum CurrencyType {
  USD = 'USD',
  GBP = 'GBP',
  EUR = 'EUR',
}
