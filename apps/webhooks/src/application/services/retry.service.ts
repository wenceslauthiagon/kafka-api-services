import { Retry } from '@zro/utils/domain';

export interface RetryService {
  /**
   * Push a new retry.
   * @param id.
   * @returns void.
   */
  push(retry: Retry): Promise<void>;
}
