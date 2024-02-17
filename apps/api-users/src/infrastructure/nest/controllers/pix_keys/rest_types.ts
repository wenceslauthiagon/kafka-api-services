import { KeyState, KeyType } from '@zro/pix-keys/domain';

export const pixKeyTypeRest = {
  enum: KeyType,
  description: `Pix Key state:<br>
    <ul>
      <li>${KeyType.CPF}: Key type CPF.
      <li>${KeyType.EVP}: Key type EVP.
      <li>${KeyType.EMAIL}: Key type EMAIL.
      <li>${KeyType.PHONE}: Key type PHONE.
      <li>${KeyType.CNPJ}: Key type CNPJ.
    </ul>`,
  example: KeyType.EMAIL,
};

export const pixKeyStateRest = {
  enum: KeyState,
  description: `Pix Key state:<br>
    <ul>
      <li>${KeyState.PENDING}: Key state PENDING.
      <li>${KeyState.CONFIRMED}: Key state CONFIRMED.
      <li>${KeyState.NOT_CONFIRMED}: Key state NOT_CONFIRMED.
      <li>${KeyState.ADD_KEY_READY}: Key state ADD_KEY_READY.
      <li>${KeyState.READY}: Key state READY.
      <li>${KeyState.CANCELED}: Key state CANCELED.
      <li>${KeyState.ERROR}: Key state ERROR.
      <li>${KeyState.DELETING}: Key state DELETING.
      <li>${KeyState.DELETED}: Key state DELETED.
      <li>${KeyState.PORTABILITY_PENDING}: Key state PORTABILITY_PENDING.
      <li>${KeyState.PORTABILITY_OPENED}: Key state PORTABILITY_OPENED.
      <li>${KeyState.PORTABILITY_STARTED}: Key state PORTABILITY_STARTED.
      <li>${KeyState.PORTABILITY_READY}: Key state PORTABILITY_READY.
      <li>${KeyState.PORTABILITY_CONFIRMED}: Key state PORTABILITY_CONFIRMED.
      <li>${KeyState.PORTABILITY_CANCELED}: Key state PORTABILITY_CANCELED.
      <li>${KeyState.PORTABILITY_REQUEST_PENDING}: Key state PORTABILITY_REQUEST_PENDING.
      <li>${KeyState.PORTABILITY_REQUEST_CANCEL_OPENED}: Key state PORTABILITY_REQUEST_CANCEL_OPENED.
      <li>${KeyState.PORTABILITY_REQUEST_CANCEL_STARTED}: Key state PORTABILITY_REQUEST_CANCEL_STARTED.
      <li>${KeyState.PORTABILITY_REQUEST_CONFIRM_OPENED}: Key state PORTABILITY_REQUEST_CONFIRM_OPENED.
      <li>${KeyState.PORTABILITY_REQUEST_CONFIRM_STARTED}: Key state PORTABILITY_REQUEST_CONFIRM_STARTED.
      <li>${KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED}: Key state PORTABILITY_REQUEST_AUTO_CONFIRMED.
      <li>${KeyState.OWNERSHIP_PENDING}: Key state OWNERSHIP_PENDING.
      <li>${KeyState.OWNERSHIP_OPENED}: Key state OWNERSHIP_OPENED.
      <li>${KeyState.OWNERSHIP_STARTED}: Key state OWNERSHIP_STARTED.
      <li>${KeyState.OWNERSHIP_CONFIRMED}: Key state OWNERSHIP_CONFIRMED.
      <li>${KeyState.OWNERSHIP_READY}: Key state OWNERSHIP_READY.
      <li>${KeyState.OWNERSHIP_CANCELED}: Key state OWNERSHIP_CANCELED.
      <li>${KeyState.OWNERSHIP_CONFLICT}: Key state OWNERSHIP_CONFLICT.
      <li>${KeyState.OWNERSHIP_WAITING}: Key state OWNERSHIP_WAITING.
      <li>${KeyState.CLAIM_NOT_CONFIRMED}: Key state CLAIM_NOT_CONFIRMED.
      <li>${KeyState.CLAIM_PENDING}: Key state CLAIM_PENDING.
      <li>${KeyState.CLAIM_CLOSING}: Key state CLAIM_CLOSING.
      <li>${KeyState.CLAIM_DENIED}: Key state CLAIM_DENIED.
      <li>${KeyState.CLAIM_CLOSED}: Key state CLAIM_CLOSED.
    </ul>`,
  example: KeyState.READY,
};
