import { DatabaseRepository } from '@zro/common';
import { Plan, PlanRepository } from '@zro/pix-zro-pay/domain';
import { PlanModel } from '@zro/pix-zro-pay/infrastructure';

export class PlanDatabaseRepository
  extends DatabaseRepository
  implements PlanRepository
{
  static toDomain(planModel: PlanModel): Plan {
    return planModel?.toDomain() ?? null;
  }

  async create(plan: Plan): Promise<Plan> {
    const planGenerated = await PlanModel.create<PlanModel>(plan, {
      transaction: this.transaction,
    });

    plan.createdAt = planGenerated.createdAt;
    return plan;
  }

  async update(plan: Plan): Promise<Plan> {
    await PlanModel.update<PlanModel>(plan, {
      where: { id: plan.id },
      transaction: this.transaction,
    });

    return plan;
  }

  async getById(id: number): Promise<Plan> {
    return PlanModel.findOne<PlanModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PlanDatabaseRepository.toDomain);
  }
}
