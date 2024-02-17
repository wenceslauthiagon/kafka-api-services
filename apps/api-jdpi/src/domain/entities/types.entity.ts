export enum InitiationType {
  MANUAL = 'MANUAL',
  KEY = 'KEY',
  QRCODE_STATIC = 'QRCODE_STATIC',
  QRCODE_DYNAMIC = 'QRCODE_DYNAMIC',
  PAYMENT_SERVICE = 'PAYMENT_SERVICE',
  QRCODE_PAYER = 'QRCODE_PAYER',
}

export enum PaymentPriorityLevelType {
  PRIORITY_PAYMENT = 'PRIORITY_PAYMENT',
  PAYMENT_UNDER_ANTI_FRAUD_ANALYSIS = 'PAYMENT_UNDER_ANTI_FRAUD_ANALYSIS',
  SCHEDULED_PAYMENT = 'SCHEDULED_PAYMENT',
}

export enum ValueType {
  RESOURCE = 'RESOURCE',
  PURCHASE = 'PURCHASE',
}

export enum NotifyStateType {
  READY = 'READY',
  ERROR = 'ERROR',
}

export enum NotifyCreditTransactionType {
  CREDIT_DEPOSIT = 'CREDIT_DEPOSIT',
  CREDIT_DEVOLUTION = 'CREDIT_DEVOLUTION',
}

export enum ResultType {
  INVALID = 'INVALID',
  VALID = 'VALID',
}

export enum NotifyCreditValidationState {
  READY = 'READY',
  FAILED = 'FAILED',
}
