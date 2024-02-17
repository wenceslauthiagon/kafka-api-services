export interface EncryptProvider {
  encrypt(plain: string): string;
  decrypt(encrypted: string): string;
}
