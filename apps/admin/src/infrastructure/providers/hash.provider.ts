import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';
import { HashProvider } from '@zro/admin/application';

@Injectable()
export class HashProviderBcrypt implements HashProvider {
  hashSync(password: string, saltOrRounds: number): string {
    return bcrypt.hashSync(password, saltOrRounds);
  }

  compareHash(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }
}
