import { Pagination, TPaginationResponse } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  Payment,
  PaymentPriorityType,
  PaymentState,
} from '@zro/pix-payments/domain';

export enum ThresholdDateComparisonType {
  BEFORE_THAN = 'BEFORE_OR_EQUAL_THAN',
  AFTER_OR_EQUAL_THAN = 'AFTER_OR_EQUAL_THAN',
}

export interface PaymentRepository {
  /**
   * Insert a PixPayment.
   * @param payment Payment to save.
   * @returns Created Payment.
   */
  create(payment: Payment): Promise<Payment>;

  /**
   * Update a PixPayment.
   * @param payment Payment to update.
   * @returns Updated payment.
   */
  update(payment: Payment): Promise<Payment>;

  /**
   * Get a Payment by id.
   * @param id Payment id to get.
   * @returns get Payment.
   */
  getById(id: string): Promise<Payment>;

  /**
   * Get a Payment by endToEndId.
   * @param endToEndId Payment endToEndId to get.
   * @returns get Payment.
   */
  getByEndToEndId(endToEndId: string): Promise<Payment>;

  /**
   * Get a Payment by id or endToEndId.
   * @param id Payment id to get.
   * @param endToEndId Payment endToEndId to get.
   * @returns get Payment.
   */
  getByIdOrEndToEndId(id: string, endToEndId: string): Promise<Payment>;

  /**
   * Get a Payment by operation and wallet.
   * @param operation Payment operation.
   * @param wallet Payment wallet.
   * @returns get Payment.
   */
  getByOperationAndWallet(
    operation: Operation,
    wallet: Wallet,
  ): Promise<Payment>;

  /**
   * Get all Payments by state and date.
   * @param state State payment to update.
   * @param paymentDate Date payment in format YYYY-MM-DD to update.
   * @returns
   */
  getAllByStateAndPaymentDate(
    state: PaymentState,
    paymentDate: Date,
  ): Promise<Payment[]>;

  /**
   * Get a Payment by id and wallet.
   * @param id Payment id to get.
   * @param wallet Payment wallet.
   * @returns get Payment.
   */
  getByIdAndWallet(id: string, wallet: Wallet): Promise<Payment>;

  /**
   * Get all Payments by state.
   * @param state State payment to update.
   * @returns
   */
  getAllByState(state: PaymentState): Promise<Payment[]>;

  /**
   * List all Payments by wallet.
   * @param pagination The pagination.
   * @param user Payment's user.
   * @param wallet Payment's wallet.
   * @param states The payment states to be filtered.
   * @param paymentDatePeriodStart Start Payment Date.
   * @param paymentDatePeriodEnd End payment Date.
   * @param createdAtPeriodStart Start created payment date.
   * @param createdAtPeriodEnd End created payment date.v
   * @param endToEndId End to end id.
   * @param clientDocument Client document.
   * @return Payments found.
   */
  getAll(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    states?: PaymentState[],
    paymentDatePeriodStart?: Date,
    paymentDatePeriodEnd?: Date,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
  ): Promise<TPaginationResponse<Payment>>;

  /**
   * Get a Payment by operation.
   * @param operation Payment operation.
   * @returns get Payment.
   */
  getByOperation(operation: Operation): Promise<Payment>;

  /**
   * Get all payments by state, threshold date, date comparison type and priority type.
   * @param state State payment to update.
   * @param date Threshold date to be compared.
   * @param comparisonType Date comparison type.
   * @param priorityType Pix Payment priority type.
   * @returns Payments found.
   */
  getAllByStateThresholdDateAndPriorityType(
    state: PaymentState,
    date: Date,
    comparisonType: ThresholdDateComparisonType,
    priorityType?: PaymentPriorityType,
  ): Promise<Payment[]>;
}
