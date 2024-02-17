import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvalidDataFormatException } from '../exceptions/invalid_data_format.exception';

export interface EncryptConfig {
  APP_ENCRYPT_PASSWORD: string;
}

const IV_LENGTH = 16; // For AES, this is always 16
const PASSWORD_LENGTH = 32; // For AES, this is always 32

@Injectable()
export class EncryptService {
  private password: string;

  constructor(private readonly configService: ConfigService<EncryptConfig>) {
    this.password = this.configService.get<string>('APP_ENCRYPT_PASSWORD');

    if (this.password?.length !== PASSWORD_LENGTH) {
      throw new InvalidDataFormatException([
        `Password length must be ${PASSWORD_LENGTH}`,
      ]);
    }
  }

  encrypt(plain: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.password),
      iv,
    );
    let encrypted = cipher.update(plain);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(encrypted: string): string {
    const textParts = encrypted.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.password),
      iv,
    );
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }
}

@Module({
  imports: [ConfigModule],
  providers: [EncryptService],
  exports: [EncryptService],
})
export class EncryptModule {}
