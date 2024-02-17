import { Inject, Module } from '@nestjs/common';
import { VALIDATOR } from './validation.constants';
import { validate } from '../utils/validate.util';

export type Validator = (value: any) => Promise<void>;

export const InjectValidator = () => Inject(VALIDATOR);

@Module({
  exports: [VALIDATOR],
  providers: [
    {
      provide: VALIDATOR,
      useValue: validate,
    },
  ],
})
export class ValidationModule {}
