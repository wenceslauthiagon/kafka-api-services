import { v4 as uuidV4 } from 'uuid';
import { cpf } from 'cpf-cnpj-validator';
import {
  JdpiErrorTypes,
  JdpiFraudDetectionStatus,
  JdpiPersonType,
  JdpiPixInfractionFraudType,
} from '@zro/jdpi/domain';

export const success = () => {
  return Promise.resolve({
    status: 200,
    data: {
      dtHrRetornoDict: new Date(),
      idCorrelacao: uuidV4(),
      idMarcacaoFraude: uuidV4(),
      tpPessoa: JdpiPersonType.NATURAL_PERSON,
      cpfCnpj: Number(cpf.generate()),
      chave: uuidV4(),
      tpFraude: JdpiPixInfractionFraudType.DUMMY_ACCOUNT,
      stMarcacaoFraude: JdpiFraudDetectionStatus.REGISTERED,
      dtHrCriacaoMarcacaoFraude: new Date(),
      dtHrUltModificacao: new Date(),
    },
  });
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
