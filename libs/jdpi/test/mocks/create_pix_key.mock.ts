import { v4 as uuidV4 } from 'uuid';
import { JdpiErrorTypes, JdpiKeyType } from '@zro/jdpi/domain';
import { JdpiCreatePixKeyRequest } from '@zro/jdpi';

export const success = (_: string, pixKey: JdpiCreatePixKeyRequest) => {
  const data = {
    chave: pixKey.tpChave === JdpiKeyType.EVP ? uuidV4() : pixKey.chave,
    dtHrCriacaoChave: new Date(),
    dtHrInicioPosseChave: new Date(),
  };

  return Promise.resolve({ data });
};

export const thirdParty = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.ENTRY_KEY_OWNED_BY_DIFFERENT_PERSON,
        mensagem:
          'Já existe vínculo para essa chave mas ela é possuída por outra pessoa. Indica-se que seja feita uma reivindicação de posse.',
      },
    },
  };
  return Promise.reject(error);
};

export const portability = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.ENTRY_KEY_IN_CUSTODY_OF_DIFFERENT_PARTICIPANT,
        mensagem:
          'Já existe vínculo para essa chave com o mesmo dono, mas ela encontra-se associada a outro participante. Indica-se que seja feita uma reivindicação de portabilidade.',
      },
    },
  };
  return Promise.reject(error);
};

export const lockedKeyByClaim = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.ENTRY_LOCKED_BY_CLAIM,
        mensagem:
          'Existe uma reivindicação com status diferente de concluída ou cancelada para a chave do vínculo. Enquanto estiver nessa situação, o vínculo não pode ser excluído.',
      },
    },
  };
  return Promise.reject(error);
};

export const maxNumOfKeysReached = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.ENTRY_LIMIT_EXCEEDED,
        mensagem:
          'Número de vínculos associados a conta transacional excedeu o limite máximo.',
      },
    },
  };
  return Promise.reject(error);
};

export const alreadyExists = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.ENTRY_ALREADY_EXISTS,
        mensagem:
          'Já existe vínculo para essa chave com o mesmo participante e dono.',
      },
    },
  };
  return Promise.reject(error);
};

export const entryInvalid = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.ENTRY_INVALID,
        mensagem: 'Existem campos inválidos ao tentar criar novo vínculo.',
      },
    },
  };
  return Promise.reject(error);
};

export const offline = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.SERVICE_UNAVAILABLE,
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};

export const unexpectedError = () => {
  const error = {
    response: {
      data: {
        codigo: 'Unexpected Error',
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};
