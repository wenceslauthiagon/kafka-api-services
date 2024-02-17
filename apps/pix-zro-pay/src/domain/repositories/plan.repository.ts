import { Plan } from '@zro/pix-zro-pay/domain';

export interface PlanRepository {
  /**
   * Insert a Plan.
   * @param plan Plan to save.
   * @returns Created Plan.
   */
  create(plan: Plan): Promise<Plan>;

  /**
   * Update a Plan.
   * @param plan Plan to update.
   * @returns Updated plan.
   */
  update(plan: Plan): Promise<Plan>;

  /**
   * get a Plan by id.
   * @param id Plan id to get.
   * @returns get Plan.
   */
  getById(id: number): Promise<Plan>;
}
