import { Operation } from '@zro/operations/domain';
import {
  ThresholdDateComparisonType,
  WarningPixDevolution,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';

export interface WarningPixDevolutionRepository {
  /**
   * Insert a WarningPixDevolution.
   * @param warningPixDevolution warningPixDevolution to save.
   * @returns Created warningPixDevolution.
   */
  create: (
    warningPixDevolution: WarningPixDevolution,
  ) => Promise<WarningPixDevolution>;

  /**
   * Update warningPixDevolution.
   * @param warningPixDevolution warningPixDevolution to update.
   * @returns Updated warningPixDevolution.
   */
  update: (
    warningPixDevolution: WarningPixDevolution,
  ) => Promise<WarningPixDevolution>;

  /**
   * get a warningPixDevolution by id.
   * @param id warningPixDevolution id to get.
   * @returns Get warningPixDevolution.
   */
  getById: (id: string) => Promise<WarningPixDevolution>;

  /**
   * get a warningPixDevolution by operation.
   * @param operation warningPixDevolution operation to get.
   * @returns Get warningPixDevolution.
   */
  getByOperation: (operation: Operation) => Promise<WarningPixDevolution>;

  /**
   * get all warningPixDevolution by state.
   * @param state warningPixDevolution state to update.
   * @returns Get warningPixDevolution
   */
  getAllByState: (
    state: WarningPixDevolutionState,
  ) => Promise<WarningPixDevolution[]>;

  /**
   * Get all warning pix devolution by state, threshold date and date comparison type.
   * @param state Warning pix devolution state.
   * @param date Threshold date to be compared.
   * @param comparisonType Date comparison type.
   * @returns Warning pix devolution found.
   */
  getAllByStateAndThresholdDate(
    state: WarningPixDevolutionState,
    date: Date,
    comparisonType: ThresholdDateComparisonType,
  ): Promise<WarningPixDevolution[]>;
}
