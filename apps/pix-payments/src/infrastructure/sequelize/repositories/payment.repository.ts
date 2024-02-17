import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  Payment,
  PaymentPriorityType,
  PaymentRepository,
  PaymentState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';
import { PaymentModel } from '@zro/pix-payments/infrastructure';

export class PaymentDatabaseRepository
  extends DatabaseRepository
  implements PaymentRepository
{
  static toDomain(paymentModel: PaymentModel): Payment {
    return paymentModel?.toDomain() ?? null;
  }

  async create(payment: Payment): Promise<Payment> {
    const paymentGenerated = await PaymentModel.create<PaymentModel>(payment, {
      transaction: this.transaction,
    });

    payment.value = paymentGenerated.value;
    payment.createdAt = paymentGenerated.createdAt;
    return payment;
  }

  async update(payment: Payment): Promise<Payment> {
    await PaymentModel.update<PaymentModel>(payment, {
      where: { id: payment.id },
      transaction: this.transaction,
    });

    return payment;
  }

  async getById(id: string): Promise<Payment> {
    return PaymentModel.findOne<PaymentModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PaymentDatabaseRepository.toDomain);
  }

  async getByEndToEndId(endToEndId: string): Promise<Payment> {
    return PaymentModel.findOne<PaymentModel>({
      where: {
        endToEndId,
      },
      transaction: this.transaction,
    }).then(PaymentDatabaseRepository.toDomain);
  }

  async getByIdOrEndToEndId(id: string, endToEndId: string): Promise<Payment> {
    return PaymentModel.findOne<PaymentModel>({
      where: {
        ...(id ? { id } : { endToEndId }),
      },
      transaction: this.transaction,
    }).then(PaymentDatabaseRepository.toDomain);
  }

  async getByOperationAndWallet(
    operation: Operation,
    wallet: Wallet,
  ): Promise<Payment> {
    return PaymentModel.findOne<PaymentModel>({
      where: {
        [Op.or]: [
          { operationId: operation.id },
          { changeOperationId: operation.id },
        ],
        walletId: wallet.uuid,
      },
      transaction: this.transaction,
    }).then(PaymentDatabaseRepository.toDomain);
  }

  async getAllByStateAndPaymentDate(
    state: PaymentState,
    paymentDate: Date,
  ): Promise<Payment[]> {
    return PaymentModel.findAll<PaymentModel>({
      where: {
        state,
        paymentDate: {
          [Op.between]: [
            getMoment(paymentDate).startOf('day').toISOString(),
            getMoment(paymentDate).endOf('day').toISOString(),
          ],
        },
      },
      transaction: this.transaction,
    }).then((data) => data.map(PaymentDatabaseRepository.toDomain));
  }

  async getByIdAndWallet(id: string, wallet: Wallet): Promise<Payment> {
    return PaymentModel.findOne<PaymentModel>({
      where: {
        id,
        walletId: wallet.uuid,
      },
      transaction: this.transaction,
    }).then(PaymentDatabaseRepository.toDomain);
  }

  async getAllByState(state: PaymentState): Promise<Payment[]> {
    return PaymentModel.findAll<PaymentModel>({
      where: {
        state,
      },
      transaction: this.transaction,
    }).then((data) => data.map(PaymentDatabaseRepository.toDomain));
  }

  async getAll(
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
  ): Promise<TPaginationResponse<Payment>> {
    return PaymentModel.findAndCountAll<PaymentModel>({
      where: {
        ...(user?.uuid && { userId: user.uuid }),
        ...(wallet?.uuid && { walletId: wallet.uuid }),
        ...(states && { state: { [Op.in]: states } }),
        ...(paymentDatePeriodStart &&
          paymentDatePeriodEnd && {
            paymentDate: {
              [Op.between]: [
                getMoment(paymentDatePeriodStart).startOf('day').toISOString(),
                getMoment(paymentDatePeriodEnd).endOf('day').toISOString(),
              ],
            },
          }),
        ...(createdAtPeriodStart &&
          createdAtPeriodEnd && {
            createdAt: {
              [Op.between]: [
                getMoment(createdAtPeriodStart).startOf('day').toISOString(),
                getMoment(createdAtPeriodEnd).endOf('day').toISOString(),
              ],
            },
          }),
        ...(endToEndId && { endToEndId }),
        ...(clientDocument && { ownerDocument: clientDocument }),
      },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(PaymentDatabaseRepository.toDomain),
      ),
    );
  }

  async getByOperation(operation: Operation): Promise<Payment> {
    return PaymentModel.findOne<PaymentModel>({
      where: {
        [Op.or]: [
          { operationId: operation.id },
          { changeOperationId: operation.id },
        ],
      },
      transaction: this.transaction,
    }).then(PaymentDatabaseRepository.toDomain);
  }

  async getAllByStateThresholdDateAndPriorityType(
    state: PaymentState,
    date: Date,
    comparisonType: ThresholdDateComparisonType,
    priorityType?: PaymentPriorityType,
  ): Promise<Payment[]> {
    const updatedAt =
      comparisonType === ThresholdDateComparisonType.BEFORE_THAN
        ? {
            [Op.lt]: date,
          }
        : {
            [Op.gte]: date,
          };

    return PaymentModel.findAll<PaymentModel>({
      where: {
        state,
        updatedAt,
        ...(priorityType && { priorityType }),
      },
      transaction: this.transaction,
    }).then((data) => data.map(PaymentDatabaseRepository.toDomain));
  }
}
