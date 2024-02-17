import {
  DecodedPixKey,
  DecodedPixKeyState,
  PixKey,
} from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';

export interface PixKeyService {
  /**
   * Get PixKey by id.
   * @param pixKey The PixKey.
   * @param user The User.
   * @returns PixKey if found or null otherwise.
   */
  getPixKeyByIdAndUser(pixKey: PixKey, user: User): Promise<PixKey>;

  /**
   * Get PixKey by key and user.
   * @param pixKey The PixKey.
   * @param user The User.
   * @returns PixKey if found or null otherwise.
   */
  getPixKeyByKeyAndUser(pixKey: PixKey, user: User): Promise<PixKey>;

  /**
   * Get DecodedPixKey by id.
   * @param id The DecodedPixKey id.
   * @returns DecodedPixKey if found or null otherwise.
   */
  getDecodedPixKeyById(id: string): Promise<DecodedPixKey>;

  /**
   * Get DecodedPixKey by id.
   * @param id The DecodedPixKey id.
   * @param state The DecodedPixKey state.
   * @returns DecodedPixKey updated.
   */
  updateDecodedPixKeyStateById(
    id: string,
    state: DecodedPixKeyState,
  ): Promise<DecodedPixKey>;
}
