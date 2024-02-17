import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { Admin, AdminRepository } from '@zro/admin/domain';
import { AdminModel } from '@zro/admin/infrastructure';

export class AdminDatabaseRepository
  extends DatabaseRepository
  implements AdminRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(adminModel: AdminModel): Admin {
    return adminModel?.toDomain() ?? null;
  }

  async getByEmail(email: string): Promise<Admin> {
    return AdminModel.findOne<AdminModel>({
      where: { email },
      transaction: this.transaction,
    }).then(AdminDatabaseRepository.toDomain);
  }

  async getById(id: number): Promise<Admin> {
    return AdminModel.findOne<AdminModel>({
      where: { id },
      transaction: this.transaction,
    }).then(AdminDatabaseRepository.toDomain);
  }

  async update(admin: Admin): Promise<Admin> {
    await AdminModel.update<AdminModel>(admin, {
      where: { id: admin.id },
      transaction: this.transaction,
    });

    return admin;
  }
}
