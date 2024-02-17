export interface HashProvider {
  compareHash: (password: string, hash: string) => boolean;
  hashSync: (password: string, saltOrRounds: number) => string;
}
