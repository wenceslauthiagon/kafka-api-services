import { Injectable, Module } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptHashService {
  hashSync(password: string, saltOrRounds: number): string {
    return bcrypt.hashSync(password, saltOrRounds);
  }
  compareHash(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }
}

@Module({
  providers: [BcryptHashService],
  exports: [BcryptHashService],
})
export class BcryptModule {}
