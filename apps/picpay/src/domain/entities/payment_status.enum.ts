export enum PaymentStatusEnum {
  CREATED = 'created',
  CANCELED = 'expired',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CHARGEBACK = 'chargeback',
  PRECHECKOUT = 'pre_checkout',
  CRONJOBUPDATED = 'cron_job_updated',
}
