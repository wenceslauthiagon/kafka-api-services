import { Webhook } from '@zro/webhooks/domain';

export interface WebhookRepository {
  /**
   * Insert a Webhook.
   * @param {Webhook} Webhook Webhook to save.
   * @returns {Webhook} Created Webhook.
   */
  create: (webhook: Webhook) => Promise<Webhook>;

  /**
   * Update a Webhook.
   * @param {Webhook} Webhook Webhook to update.
   * @returns {Webhook} Updated Webhook.
   */
  update: (webhook: Webhook) => Promise<Webhook>;

  /**
   * Search by Webhook ID.
   * @param {UUID} id Webhook ID.
   * @return {Webhook} Webhook found.
   */
  getById: (id: string) => Promise<Webhook>;

  /**
   * Search webhook activate with payment completed type by account and agency.
   * @param {string} accountNumber Account number.
   * @param {string} agencyNumber Agency number.
   * @return {Webhook} Webhook found.
   */
  getActivateAndPaymentCompletedByAccountAndAgency: (
    accountNumber: string,
    agencyNumber: string,
  ) => Promise<Webhook>;

  /**
   * Search webhook activate with devolution received type by account and agency.
   * @param {string} accountNumber Account number.
   * @param {string} agencyNumber Agency number.
   * @return {Webhook} Webhook found.
   */
  getActivateAndDevolutionReceivedByAccountAndAgency: (
    accountNumber: string,
    agencyNumber: string,
  ) => Promise<Webhook>;

  /**
   * Search webhook activate with deposit received type by account and agency.
   * @param {string} accountNumber Account number.
   * @param {string} agencyNumber Agency number.
   * @return {Webhook} Webhook found.
   */
  getActivateAndDepositReceivedByAccountAndAgency: (
    accountNumber: string,
    agencyNumber: string,
  ) => Promise<Webhook>;

  /**
   * Search webhook activate with devolution completed type by account and agency.
   * @param {string} accountNumber Account number.
   * @param {string} agencyNumber Agency number.
   * @return {Webhook} Webhook found.
   */
  getActivateAndDevolutionCompletedByAccountAndAgency: (
    accountNumber: string,
    agencyNumber: string,
  ) => Promise<Webhook>;

  /**
   * Search webhook activate with payment failed type by account and agency.
   * @param {string} accountNumber Account number.
   * @param {string} agencyNumber Agency number.
   * @return {Webhook} Webhook found.
   */
  getActivateAndPaymentFailedByAccountAndAgency: (
    accountNumber: string,
    agencyNumber: string,
  ) => Promise<Webhook>;

  /**
   * Search webhook activate with devolution failed type by account and agency.
   * @param {string} accountNumber Account number.
   * @param {string} agencyNumber Agency number.
   * @return {Webhook} Webhook found.
   */
  getActivateAndDevolutionFailedByAccountAndAgency: (
    accountNumber: string,
    agencyNumber: string,
  ) => Promise<Webhook>;
}
