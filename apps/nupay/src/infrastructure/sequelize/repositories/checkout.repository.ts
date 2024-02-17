import { Injectable } from '@nestjs/common';
import { Op, Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { CheckoutRepository } from '@zro/nupay/domain/repositories/checkout.repository';
import { Checkout } from '@zro/nupay/domain/entities/checkout.entity';
import { CheckoutModel } from '../models/checkout.model';

@Injectable()
export class CheckoutDatabaseRepository
  extends DatabaseRepository
  implements CheckoutRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(checkout: CheckoutModel): Checkout {
    return checkout?.toDomain() ?? null;
  }

  async create(checkout: Checkout): Promise<Checkout> {
    const createdCheckout = await CheckoutModel.create<CheckoutModel>(
      checkout,
      {
        transaction: this.transaction,
      },
    );

    checkout.createdAt = createdCheckout.createdAt;

    return checkout;
  }

  async getById(id: string): Promise<Checkout> {
    return CheckoutModel.findOne<CheckoutModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(CheckoutDatabaseRepository.toDomain);
  }

  async getAll(): Promise<Array<Checkout>> {
    return CheckoutModel.findAll<CheckoutModel>({
      transaction: this.transaction,
    });
  }
  async getByReferenceId(referenceId: string): Promise<Checkout> {
    return CheckoutModel.findOne<CheckoutModel>({
      where: {
        referenceId,
      },
      transaction: this.transaction,
    }).then(CheckoutDatabaseRepository.toDomain);
  }

  async findPending(): Promise<CheckoutModel[]> {
    return CheckoutModel.findAll({
      where: {
        status: {
          [Op.or]: ['WAITING_PAYMENT_METHOD', 'REFUND_REFUNDING'],
        },
      },
      transaction: this.transaction,
    });
  }

  async update(checkout: Checkout): Promise<Checkout> {
    await CheckoutModel.update<CheckoutModel>(checkout, {
      where: { id: checkout.id },
      transaction: this.transaction,
    });

    return checkout;
  }
}
