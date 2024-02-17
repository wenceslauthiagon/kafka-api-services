import { Retry } from '../entities/retry.entity';

export interface RetryRepository {
  create: (retry: Retry) => Promise<Retry>;
  delete: (retry: Retry) => Promise<void>;
  getById: (id: string) => Promise<Retry>;
  getAll: (limit: number, offset: number) => Promise<Retry[]>;
}
