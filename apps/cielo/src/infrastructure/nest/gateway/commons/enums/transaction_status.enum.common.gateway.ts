export enum CieloTransactionStatusEnum {
  notfinished = 0,
  authorized = 1,
  payment_confirmed = 2,
  denied = 3,
  voided = 10,
  refunded = 11,
  pending = 12,
  aborted = 13,
  scheduled = 20,
  precheckout = 30,
}
